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


# ══════════════════════════════════════════════════════════════════════════════
# V2 API Endpoints — Mood, Journal, Habits, CBT, Emotions, Analytics, Profile
# ══════════════════════════════════════════════════════════════════════════════

from app.agents.analyzer import (
    detect_emotions_local,
    detect_emotions_ai,
    analyze_sentiment_local,
    generate_ai_summary,
    generate_mood_insights,
    generate_cbt_worksheet,
    generate_action_plan,
)


# ── Mood Entries ──────────────────────────────────────────────────────────────

class MoodEntryRequest(BaseModel):
    user_id: str
    date: str | None = None
    mood_score: int
    mood_emoji: str = "😐"
    stress_level: int | None = None
    anxiety_level: int | None = None
    energy_level: int | None = None
    sleep_hours: float | None = None
    water_intake: int | None = None
    exercise_done: bool = False
    meditation_done: bool = False
    notes: str = ""


@app.post("/mood-entries")
async def create_mood_entry_endpoint(req: MoodEntryRequest):
    entry = await crud.create_mood_entry(req.user_id, req.model_dump())
    if not entry:
        raise HTTPException(status_code=500, detail="Failed to save mood entry")
    return {"mood_entry": entry}


@app.get("/mood-entries/{user_id}")
async def get_mood_entries_endpoint(user_id: str, start_date: str | None = None, end_date: str | None = None):
    entries = await crud.get_mood_entries(user_id, start_date, end_date)
    return {"mood_entries": entries}


@app.delete("/mood-entries/{entry_id}")
async def delete_mood_entry_endpoint(entry_id: str, user_id: str):
    ok = await crud.delete_mood_entry(entry_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}


# ── Journal Entries ───────────────────────────────────────────────────────────

class JournalEntryRequest(BaseModel):
    user_id: str
    title: str = ""
    content: str = ""
    content_html: str | None = None
    is_favorite: bool = False


@app.post("/journal")
async def create_journal_entry_endpoint(req: JournalEntryRequest):
    data = req.model_dump()
    # Auto-analyze sentiment
    if data["content"]:
        sentiment, score = analyze_sentiment_local(data["content"])
        data["sentiment"] = sentiment
        data["sentiment_score"] = score
        data["emotions"] = detect_emotions_local(data["content"])
    entry = await crud.create_journal_entry(req.user_id, data)
    if not entry:
        raise HTTPException(status_code=500, detail="Failed to save journal entry")
    return {"journal_entry": entry}


@app.get("/journal/{user_id}")
async def get_journal_entries_endpoint(user_id: str, search: str | None = None, sentiment: str | None = None, limit: int = 50):
    entries = await crud.get_journal_entries(user_id, search, sentiment, limit)
    return {"journal_entries": entries}


class JournalUpdateRequest(BaseModel):
    user_id: str
    title: str | None = None
    content: str | None = None
    content_html: str | None = None
    is_favorite: bool | None = None


@app.put("/journal/{entry_id}")
async def update_journal_entry_endpoint(entry_id: str, req: JournalUpdateRequest):
    data = {k: v for k, v in req.model_dump().items() if v is not None and k != "user_id"}
    if "content" in data and data["content"]:
        sentiment, score = analyze_sentiment_local(data["content"])
        data["sentiment"] = sentiment
        data["sentiment_score"] = score
        data["emotions"] = detect_emotions_local(data["content"])
    entry = await crud.update_journal_entry(entry_id, req.user_id, data)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"journal_entry": entry}


@app.delete("/journal/{entry_id}")
async def delete_journal_entry_endpoint(entry_id: str, user_id: str):
    ok = await crud.delete_journal_entry(entry_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}


@app.post("/journal/{entry_id}/analyze")
async def analyze_journal_entry_endpoint(entry_id: str, user_id: str):
    entries = await crud.get_journal_entries(user_id)
    entry = next((e for e in entries if e.get("id") == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    content = entry.get("content", "")
    if not content:
        raise HTTPException(status_code=400, detail="No content to analyze")

    emotions = await detect_emotions_ai(content)
    sentiment, score = analyze_sentiment_local(content)
    summary = await generate_ai_summary(content)

    update_data = {
        "sentiment": sentiment,
        "sentiment_score": score,
        "emotions": emotions,
        "ai_summary": summary,
    }
    updated = await crud.update_journal_entry(entry_id, user_id, update_data)
    return {"analysis": {"sentiment": sentiment, "sentiment_score": score, "emotions": emotions, "ai_summary": summary}, "journal_entry": updated}


# ── Habits ────────────────────────────────────────────────────────────────────

@app.get("/habits/{user_id}/definitions")
async def get_habit_definitions_endpoint(user_id: str):
    habits = await crud.ensure_default_habits(user_id)
    return {"habits": habits}


class HabitCompleteRequest(BaseModel):
    user_id: str
    habit_definition_id: str
    date: str
    completed: bool = True


@app.post("/habits/complete")
async def complete_habit_endpoint(req: HabitCompleteRequest):
    result = await crud.complete_habit(req.user_id, req.habit_definition_id, req.date, req.completed)
    return {"result": result}


@app.get("/habits/{user_id}/progress")
async def get_habit_progress_endpoint(user_id: str, start_date: str | None = None, end_date: str | None = None):
    definitions = await crud.ensure_default_habits(user_id)
    completions = await crud.get_habit_completions(user_id, start_date, end_date)
    streaks = await crud.get_habit_streaks(user_id)
    return {"definitions": definitions, "completions": completions, "streaks": streaks}


# ── CBT Worksheets ────────────────────────────────────────────────────────────

class CBTWorksheetRequest(BaseModel):
    user_id: str
    situation: str
    automatic_thought: str
    emotion: str
    emotion_intensity: int | None = None
    ai_generate: bool = True


@app.post("/cbt-worksheets")
async def create_cbt_worksheet_endpoint(req: CBTWorksheetRequest):
    data = req.model_dump()
    if req.ai_generate:
        ai_result = await generate_cbt_worksheet(req.situation, req.automatic_thought, req.emotion)
        data["thinking_errors"] = ai_result.get("thinking_errors", [])
        data["alternative_thought"] = ai_result.get("alternative_thought", "")
        data["action_plan"] = ai_result.get("action_plan", "")
        data["ai_generated"] = True
    ws = await crud.create_cbt_worksheet(req.user_id, data)
    if not ws:
        raise HTTPException(status_code=500, detail="Failed to create worksheet")
    return {"worksheet": ws}


@app.get("/cbt-worksheets/{user_id}")
async def get_cbt_worksheets_endpoint(user_id: str, limit: int = 20):
    worksheets = await crud.get_cbt_worksheets(user_id, limit)
    return {"worksheets": worksheets}


@app.delete("/cbt-worksheets/{worksheet_id}")
async def delete_cbt_worksheet_endpoint(worksheet_id: str, user_id: str):
    ok = await crud.delete_cbt_worksheet(worksheet_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    return {"deleted": True}


# ── Action Plans ──────────────────────────────────────────────────────────────

class ActionPlanRequest(BaseModel):
    user_id: str
    session_id: str | None = None


@app.post("/action-plans")
async def create_action_plan_endpoint(req: ActionPlanRequest):
    chat_history = []
    if req.session_id:
        chat_history = await crud.get_session_history(req.session_id)
    plan_data = await generate_action_plan(chat_history)
    plan_data["session_id"] = req.session_id
    plan = await crud.create_action_plan(req.user_id, plan_data)
    if not plan:
        raise HTTPException(status_code=500, detail="Failed to create action plan")
    return {"action_plan": plan}


@app.get("/action-plans/{user_id}")
async def get_action_plans_endpoint(user_id: str, limit: int = 10):
    plans = await crud.get_action_plans(user_id, limit)
    return {"action_plans": plans}


# ── Emotion Detection ─────────────────────────────────────────────────────────

class EmotionDetectRequest(BaseModel):
    text: str
    use_ai: bool = False


@app.post("/emotions/detect")
async def detect_emotions_endpoint(req: EmotionDetectRequest):
    if req.use_ai:
        emotions = await detect_emotions_ai(req.text)
    else:
        emotions = detect_emotions_local(req.text)
    return {"emotions": emotions}


# ── User Profile ──────────────────────────────────────────────────────────────

class ProfileRequest(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
    age: int | None = None
    gender: str | None = None
    timezone: str | None = None
    goals: list[str] | None = None
    preferred_reminder_time: str | None = None
    wellness_goals: str | None = None


@app.get("/profile/{user_id}")
async def get_profile_endpoint(user_id: str):
    profile = await crud.get_user_profile(user_id)
    return {"profile": profile}


@app.put("/profile/{user_id}")
async def update_profile_endpoint(user_id: str, req: ProfileRequest):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    profile = await crud.upsert_user_profile(user_id, data)
    return {"profile": profile}


# ── User Settings ─────────────────────────────────────────────────────────────

class SettingsRequest(BaseModel):
    theme: str | None = None
    notifications_enabled: bool | None = None
    email_notifications: bool | None = None
    language: str | None = None
    data_sharing: bool | None = None
    analytics_enabled: bool | None = None


@app.get("/settings/{user_id}")
async def get_settings_endpoint(user_id: str):
    s = await crud.get_user_settings(user_id)
    return {"settings": s}


@app.put("/settings/{user_id}")
async def update_settings_endpoint(user_id: str, req: SettingsRequest):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    s = await crud.upsert_user_settings(user_id, data)
    return {"settings": s}


# ── Reminders ─────────────────────────────────────────────────────────────────

class RemindersRequest(BaseModel):
    journal_enabled: bool | None = None
    journal_time: str | None = None
    meditation_enabled: bool | None = None
    meditation_time: str | None = None
    water_enabled: bool | None = None
    water_interval: int | None = None
    sleep_enabled: bool | None = None
    sleep_time: str | None = None
    mood_enabled: bool | None = None
    mood_time: str | None = None


@app.get("/reminders/{user_id}")
async def get_reminders_endpoint(user_id: str):
    r = await crud.get_reminders(user_id)
    return {"reminders": r}


@app.put("/reminders/{user_id}")
async def update_reminders_endpoint(user_id: str, req: RemindersRequest):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    r = await crud.upsert_reminders(user_id, data)
    return {"reminders": r}


# ── Analytics ─────────────────────────────────────────────────────────────────

@app.get("/analytics/{user_id}")
async def get_analytics_endpoint(user_id: str, start_date: str | None = None, end_date: str | None = None):
    mood_entries = await crud.get_mood_entries(user_id, start_date, end_date)
    insights = await generate_mood_insights(mood_entries)
    habits = await crud.ensure_default_habits(user_id)
    completions = await crud.get_habit_completions(user_id, start_date, end_date)
    return {
        "mood_entries": mood_entries,
        "insights": insights,
        "habit_definitions": habits,
        "habit_completions": completions,
    }


# ── Data Export / Delete ──────────────────────────────────────────────────────

class CrisisLogRequest(BaseModel):
    user_id: str | None = None
    session_id: str | None = None
    content: str
    threat_level: str = "crisis"


@app.post("/crisis-log")
async def log_crisis_endpoint(req: CrisisLogRequest):
    res = await crud.create_crisis_log(req.user_id, req.session_id, req.content, req.threat_level)
    return {"status": "logged", "log": res}


@app.get("/export/{user_id}")
async def export_data_endpoint(user_id: str):
    data = await crud.export_all_user_data(user_id)
    return {"data": data}


@app.delete("/delete-data/{user_id}")
async def delete_data_endpoint(user_id: str):
    ok = await crud.delete_all_user_data(user_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete data")
    return {"deleted": True}
