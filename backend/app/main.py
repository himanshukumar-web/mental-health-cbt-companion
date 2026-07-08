"""
FastAPI entry point — WebSocket streaming + REST session management.

WebSocket protocol (JSON frames):
  Client → Server: { type: "message", content: str, history: list }
  Server → Client: { type: "monitor_result", threat_level: str }
                   { type: "crisis" }                         (if crisis)
                   { type: "stream_start", agent: "therapist" }
                   { type: "token", content: str }            (repeated)
                   { type: "stream_end", threat_level: str }
                   { type: "error", content: str }
"""
import uuid
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.agents.monitor import analyze_threat_level
from app.agents.therapist import stream_response
from app.database import crud


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Sera] CBT Companion API starting...")
    yield
    print("[Sera] CBT Companion API shutting down...")


app = FastAPI(
    title="CBT Companion API",
    description="Multi-agent mental health companion powered by LangGraph + Claude",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────

class DoctorCreate(BaseModel):
    user_id: str
    full_name: str
    specialization: str = "General CBT Therapist"
    bio: str = ""
    experience_years: int = 0


class DoctorUpdate(BaseModel):
    full_name: str
    specialization: str
    bio: str
    experience_years: int
    available: bool


class AppointmentCreate(BaseModel):
    doctor_id: str
    patient_id: str
    patient_name: str
    patient_email: str
    date: str           # YYYY-MM-DD
    time_slot: str      # e.g. "10:00 AM"
    notes: str = ""


class StatusUpdate(BaseModel):
    status: str         # pending | confirmed | completed | cancelled


class DirectMessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str


# ── REST endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/sessions")
async def create_session():
    session_id = str(uuid.uuid4())
    await crud.create_session(session_id)
    return {"session_id": session_id}


@app.get("/sessions/{session_id}/history")
async def get_history(session_id: str):
    history = await crud.get_session_history(session_id)
    return {"session_id": session_id, "messages": history}


# ── Doctor endpoints ───────────────────────────────────────────────────────────

@app.get("/doctors")
async def list_doctors():
    """List all available doctors."""
    doctors = await crud.get_doctors(available_only=True)
    return {"doctors": doctors}


@app.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    """Get a single doctor's details."""
    doctor = await crud.get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@app.get("/doctors/user/{user_id}")
async def get_doctor_by_user(user_id: str):
    """Get doctor profile by auth user_id."""
    doctor = await crud.get_doctor_by_user_id(user_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor


@app.post("/doctors")
async def create_doctor(body: DoctorCreate):
    """Create a new doctor profile."""
    doctor = await crud.create_doctor(
        user_id=body.user_id,
        full_name=body.full_name,
        specialization=body.specialization,
        bio=body.bio,
        experience_years=body.experience_years,
    )
    if not doctor:
        raise HTTPException(status_code=500, detail="Failed to create doctor profile")
    return doctor


@app.put("/doctors/user/{user_id}")
async def update_doctor_profile(user_id: str, body: DoctorUpdate):
    """Update doctor profile details."""
    doctor = await crud.update_doctor_profile(
        user_id=user_id,
        full_name=body.full_name,
        specialization=body.specialization,
        bio=body.bio,
        experience_years=body.experience_years,
        available=body.available,
    )
    if not doctor:
        raise HTTPException(status_code=500, detail="Failed to update doctor profile")
    return doctor


# ── Appointment endpoints ──────────────────────────────────────────────────────

@app.post("/appointments")
async def create_appointment(body: AppointmentCreate):
    """Book a new appointment."""
    appt = await crud.create_appointment(
        doctor_id=body.doctor_id,
        patient_id=body.patient_id,
        patient_name=body.patient_name,
        patient_email=body.patient_email,
        date=body.date,
        time_slot=body.time_slot,
        notes=body.notes,
    )
    if not appt:
        raise HTTPException(status_code=500, detail="Failed to create appointment")
    return appt


@app.get("/appointments/user/{user_id}")
async def get_user_appointments(user_id: str):
    """Get all appointments for a patient."""
    appts = await crud.get_user_appointments(user_id)
    return {"appointments": appts}


@app.get("/appointments/doctor/{doctor_id}")
async def get_doctor_appointments(doctor_id: str, status: str | None = None):
    """Get all appointments for a doctor, optionally filtered by status."""
    appts = await crud.get_doctor_appointments(doctor_id, status)
    return {"appointments": appts}


@app.patch("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, body: StatusUpdate):
    """Update appointment status (confirm/cancel/complete)."""
    if body.status not in ("pending", "confirmed", "completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")
    ok = await crud.update_appointment_status(appointment_id, body.status)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update status")
    return {"id": appointment_id, "status": body.status}


# ── Admin stats endpoint ──────────────────────────────────────────────────────

@app.get("/admin/stats/{doctor_id}")
async def get_admin_stats(doctor_id: str):
    """Get dashboard statistics for a doctor."""
    stats = await crud.get_admin_stats(doctor_id)
    return stats


# ── Direct Messaging endpoints ──────────────────────────────────────────────────

@app.post("/messages")
async def send_direct_message(body: DirectMessageCreate):
    """Send a direct message between doctor and patient."""
    msg = await crud.create_direct_message(
        sender_id=body.sender_id,
        receiver_id=body.receiver_id,
        content=body.content
    )
    if not msg:
        raise HTTPException(status_code=500, detail="Failed to send message")
    return msg


@app.get("/messages/history")
async def get_message_history(user1: str, user2: str, limit: int = 50):
    """Get message history between two users."""
    history = await crud.get_direct_messages(user1, user2, limit)
    return {"messages": history}


@app.get("/messages/partners/{user_id}")
async def get_message_partners(user_id: str):
    """Get partners who have messaged or have appointments with this user."""
    partners = await crud.get_chat_partners(user_id)
    return {"partners": partners}


# ── WebSocket endpoint ─────────────────────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if data.get("type") != "message":
                continue

            content: str = data.get("content", "").strip()
            history: list = data.get("history", [])

            if not content:
                continue

            # ── Agent 2: Monitor ──────────────────────────────────────────────
            threat_level = await analyze_threat_level(content)

            await websocket.send_json(
                {"type": "monitor_result", "threat_level": threat_level}
            )

            # ── Crisis intercept ──────────────────────────────────────────────
            if threat_level == "crisis":
                await websocket.send_json({"type": "crisis"})
                await crud.save_message(session_id, "user", content, "crisis")
                continue

            # ── Agent 1: Therapist (streaming) ────────────────────────────────
            await websocket.send_json({"type": "stream_start", "agent": "therapist"})

            messages = history + [{"role": "user", "content": content}]
            full_response = ""

            try:
                async for token in stream_response(messages, threat_level):
                    full_response += token
                    await websocket.send_json({"type": "token", "content": token})
            except Exception as exc:
                import traceback
                traceback.print_exc()
                await websocket.send_json(
                    {
                        "type": "error",
                        "content": (
                            "I'm having trouble connecting right now. "
                            "Please try again — I'm here for you."
                        ),
                    }
                )
                continue

            await websocket.send_json(
                {"type": "stream_end", "threat_level": threat_level}
            )

            # Persist to Supabase (non-blocking, fire-and-forget)
            await crud.save_message(session_id, "user", content, threat_level)
            await crud.save_message(session_id, "assistant", full_response, "normal")

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
