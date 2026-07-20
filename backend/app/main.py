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
import time
import json
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.agents.monitor import analyze_threat_level
from app.agents.therapist import stream_response
from app.database import crud

from typing import Dict, Tuple

logger = logging.getLogger("sera.api")
logging.basicConfig(level=logging.INFO)

# In-memory online presence tracker: { user_id: last_heartbeat_timestamp }
online_users: Dict[str, float] = {}
ONLINE_TIMEOUT = 30  # seconds — user is "online" if heartbeat within this window

# In-memory typing status tracker: { (sender_id, receiver_id): expiration_timestamp }
typing_users: Dict[Tuple[str, str], float] = {}


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

# Parse CORS origins — support wildcard patterns
_raw_origins = settings.cors_origins.split(",")
_has_wildcard = any("*" in o for o in _raw_origins)
_cors_origins = ["*"] if _has_wildcard else [o.strip() for o in _raw_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=not _has_wildcard,  # credentials can't be used with wildcard
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    user_id: str | None = None
    mood_score: int | None = None


class MoodUpdate(BaseModel):
    mood_score: int


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


class TypingUpdate(BaseModel):
    sender_id: str
    receiver_id: str
    is_typing: bool


# ── REST endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/sessions")
async def create_session(body: SessionCreate | None = None):
    session_id = str(uuid.uuid4())
    user_id = body.user_id if body else None
    mood_score = body.mood_score if body else None
    await crud.create_session(session_id, mood_score=mood_score, user_id=user_id)
    return {"session_id": session_id}


@app.get("/users/{user_id}/sessions")
async def get_user_sessions(user_id: str):
    sessions = await crud.get_user_sessions(user_id)
    return {"sessions": sessions}


@app.get("/sessions/{session_id}/history")
async def get_history(session_id: str):
    history = await crud.get_session_history(session_id)
    return {"session_id": session_id, "messages": history}


@app.get("/sessions/{session_id}/mood")
async def get_session_mood(session_id: str):
    mood = await crud.get_session_mood(session_id)
    return {"mood_score": mood}


@app.post("/sessions/{session_id}/mood")
async def update_session_mood(session_id: str, body: MoodUpdate):
    await crud.update_session_mood(session_id, body.mood_score)
    return {"status": "ok"}


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
    
    # Auto-create notification for the doctor
    try:
        doctor = await crud.get_doctor_by_id(body.doctor_id)
        if doctor and doctor.get("user_id"):
            await crud.create_notification(
                user_id=doctor["user_id"],
                notif_type="new_appointment",
                title="New Appointment Booked 📅",
                message=f"{body.patient_name} booked an appointment for {body.date} at {body.time_slot}",
                link="/admin?tab=appointments",
            )
    except Exception as e:
        print(f"Notification creation failed: {e}")
    
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
    
    # Auto-create notification for the patient when appointment is confirmed
    if body.status == "confirmed":
        try:
            appt = await crud.get_appointment_by_id(appointment_id)
            if appt and appt.get("patient_id"):
                doctor = await crud.get_doctor_by_id(appt["doctor_id"])
                doctor_name = doctor["full_name"] if doctor else "your doctor"
                await crud.create_notification(
                    user_id=appt["patient_id"],
                    notif_type="appointment_confirmed",
                    title="Appointment Confirmed ✅",
                    message=f"Dr. {doctor_name} confirmed your appointment for {appt['date']} at {appt['time_slot']}",
                    link="/appointments/my",
                )
        except Exception as e:
            print(f"Confirmation notification failed: {e}")
    elif body.status == "cancelled":
        try:
            appt = await crud.get_appointment_by_id(appointment_id)
            if appt and appt.get("patient_id"):
                doctor = await crud.get_doctor_by_id(appt["doctor_id"])
                doctor_name = doctor["full_name"] if doctor else "your doctor"
                await crud.create_notification(
                    user_id=appt["patient_id"],
                    notif_type="appointment_cancelled",
                    title="Appointment Cancelled ❌",
                    message=f"Dr. {doctor_name} cancelled the appointment for {appt['date']} at {appt['time_slot']}",
                    link="/appointments/my",
                )
        except Exception as e:
            print(f"Cancellation notification failed: {e}")
    
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
    
    # Auto-create notification for the receiver
    try:
        # Check if sender is a doctor
        sender_doctor = await crud.get_doctor_by_user_id(body.sender_id)
        if sender_doctor:
            # Doctor sent message → notify patient
            doctor_name = sender_doctor.get("full_name", "Your doctor")
            preview = body.content[:80] + "..." if len(body.content) > 80 else body.content
            await crud.create_notification(
                user_id=body.receiver_id,
                notif_type="new_message",
                title=f"Dr. {doctor_name} replied 💬",
                message=preview,
                link="/appointments/my?tab=chat",
            )
        else:
            # Patient sent message → notify doctor
            # Find patient name from appointments
            receiver_doctor = await crud.get_doctor_by_user_id(body.receiver_id)
            if receiver_doctor:
                # Get patient name from appointments
                patient_name = "A patient"
                try:
                    appts = await crud.get_doctor_appointments(receiver_doctor["id"])
                    for appt in appts:
                        if appt.get("patient_id") == body.sender_id:
                            patient_name = appt.get("patient_name", "A patient")
                            break
                except Exception:
                    pass
                preview = body.content[:80] + "..." if len(body.content) > 80 else body.content
                await crud.create_notification(
                    user_id=body.receiver_id,
                    notif_type="new_message",
                    title=f"New message from {patient_name} 💬",
                    message=preview,
                    link="/admin?tab=chat",
                )
    except Exception as e:
        print(f"Message notification failed: {e}")
    
    return msg


@app.post("/messages/typing")
async def update_typing_status(body: TypingUpdate):
    """Update typing status for a sender typing to a receiver."""
    key = (body.sender_id, body.receiver_id)
    if body.is_typing:
        typing_users[key] = time.time() + 4.0  # Status expires in 4 seconds
    else:
        typing_users.pop(key, None)
    return {"status": "ok"}


@app.get("/messages/history")
async def get_message_history(user1: str, user2: str, limit: int = 50):
    """Get message history between two users, plus typing status of the partner (user2)."""
    history = await crud.get_direct_messages(user1, user2, limit)
    
    # Check if user2 (partner) is typing to user1 (current user)
    partner_typing_key = (user2, user1)
    is_typing = False
    if partner_typing_key in typing_users:
        if time.time() < typing_users[partner_typing_key]:
            is_typing = True
        else:
            # Clean up expired typing key
            typing_users.pop(partner_typing_key, None)
            
    return {"messages": history, "is_typing": is_typing}


@app.get("/messages/partners/{user_id}")
async def get_message_partners(user_id: str):
    """Get partners who have messaged or have appointments with this user."""
    partners = await crud.get_chat_partners(user_id)
    now = time.time()
    for p in partners:
        last_seen = online_users.get(p["user_id"], 0)
        p["is_online"] = (now - last_seen) < ONLINE_TIMEOUT
    return {"partners": partners}


@app.post("/users/heartbeat")
async def user_heartbeat(body: dict):
    """Track user online presence."""
    user_id = body.get("user_id")
    if user_id:
        online_users[user_id] = time.time()
    return {"status": "ok"}


@app.get("/users/online/{user_id}")
async def check_user_online(user_id: str):
    """Check if a specific user is online."""
    now = time.time()
    last_seen = online_users.get(user_id, 0)
    return {"user_id": user_id, "is_online": (now - last_seen) < ONLINE_TIMEOUT}


# ── Notification endpoints ─────────────────────────────────────────────────────

@app.get("/notifications/{user_id}")
async def get_notifications(user_id: str, unread_only: bool = False):
    """Get notifications for a user."""
    notifications = await crud.get_user_notifications(user_id, unread_only)
    unread_count = len([n for n in notifications if not n.get("is_read")])
    return {"notifications": notifications, "unread_count": unread_count}


@app.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read."""
    ok = await crud.mark_notification_read(notification_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")
    return {"status": "ok"}


@app.patch("/notifications/read-all/{user_id}")
async def mark_all_read(user_id: str):
    """Mark all notifications as read for a user."""
    ok = await crud.mark_all_notifications_read(user_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to mark notifications as read")
    return {"status": "ok"}


# ── WebSocket endpoint ─────────────────────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, user_id: str | None = None):
    await websocket.accept()
    logger.info("[WS] Connected: session=%s user=%s", session_id, user_id or "guest")

    try:
        while True:
            # Use a timeout so we can detect stale connections on serverless/proxy environments
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=120)
            except asyncio.TimeoutError:
                # Connection idle too long — send a server-side ping to keep alive
                try:
                    await websocket.send_json({"type": "pong"})
                except Exception:
                    break
                continue

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("[WS] Received invalid JSON from session=%s", session_id)
                continue

            # ── Ping/pong keep-alive ──────────────────────────────────────────
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if data.get("type") != "message":
                continue

            content: str = data.get("content", "").strip()
            history: list = data.get("history", [])

            if not content:
                continue

            logger.info("[WS] Message from session=%s: %s...", session_id, content[:50])

            # ── Agent 2: Monitor ──────────────────────────────────────────────
            threat_level = await analyze_threat_level(content)

            await websocket.send_json(
                {"type": "monitor_result", "threat_level": threat_level}
            )

            # ── Crisis intercept ──────────────────────────────────────────────
            if threat_level == "crisis":
                logger.warning("[WS] Crisis detected for session=%s", session_id)
                await websocket.send_json({"type": "crisis"})
                await crud.save_message(session_id, "user", content, "crisis", user_id)
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
                error_name = type(exc).__name__
                logger.error(
                    "[WS] Therapist stream failed for session=%s: %s: %s",
                    session_id, error_name, str(exc)
                )
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

            logger.info("[WS] Response complete for session=%s (%d chars)", session_id, len(full_response))

            await websocket.send_json(
                {"type": "stream_end", "threat_level": threat_level}
            )

            # Persist to Supabase (non-blocking, fire-and-forget)
            await crud.save_message(session_id, "user", content, threat_level, user_id)
            await crud.save_message(session_id, "assistant", full_response, "normal", user_id)

    except WebSocketDisconnect:
        logger.info("[WS] Disconnected: session=%s", session_id)
    except Exception as exc:
        logger.error("[WS] Unexpected error for session=%s: %s", session_id, str(exc))
