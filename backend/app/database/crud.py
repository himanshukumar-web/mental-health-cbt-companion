from datetime import datetime, timezone
from app.database.client import get_supabase
from app.utils.security import encrypt_message, decrypt_message
from app.config import settings


async def create_session(session_id: str, mood_score: int | None = None) -> bool:
    """Create a new session row. Returns True on success."""
    db = get_supabase()
    if not db:
        return False
    try:
        db.table("sessions").insert({
            "id": session_id,
            "mood_score": mood_score,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return True
    except Exception:
        return False


async def save_message(
    session_id: str,
    role: str,
    content: str,
    threat_level: str = "normal",
) -> bool:
    """Encrypt and save a message to the database."""
    db = get_supabase()
    if not db:
        return False
    try:
        encrypted = encrypt_message(content, settings.encryption_key)
        db.table("messages").insert({
            "session_id": session_id,
            "role": role,
            "content_encrypted": encrypted,
            "threat_level": threat_level,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return True
    except Exception:
        return False


async def get_session_history(session_id: str, limit: int = 20) -> list[dict]:
    """Return decrypted message history for a session."""
    db = get_supabase()
    if not db:
        return []
    try:
        result = (
            db.table("messages")
            .select("role, content_encrypted, timestamp")
            .eq("session_id", session_id)
            .order("timestamp")
            .limit(limit)
            .execute()
        )
        messages = []
        for row in result.data:
            try:
                content = decrypt_message(row["content_encrypted"], settings.encryption_key)
                messages.append({"role": row["role"], "content": content})
            except Exception:
                pass
        return messages
    except Exception:
        return []


# ── Doctor CRUD ────────────────────────────────────────────────────────────────

async def create_doctor(
    user_id: str,
    full_name: str,
    specialization: str = "General CBT Therapist",
    bio: str = "",
    experience_years: int = 0,
) -> dict | None:
    """Create a doctor profile. Returns the created doctor or None."""
    db = get_supabase()
    if not db:
        return None
    try:
        result = db.table("doctors").insert({
            "user_id": user_id,
            "full_name": full_name,
            "specialization": specialization,
            "bio": bio,
            "experience_years": experience_years,
            "available": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return result.data[0] if result.data else None
    except Exception:
        return None


async def get_doctors(available_only: bool = True) -> list[dict]:
    """List all doctors, optionally only available ones."""
    db = get_supabase()
    if not db:
        return []
    try:
        query = db.table("doctors").select("*")
        if available_only:
            query = query.eq("available", True)
        result = query.order("full_name").execute()
        return result.data or []
    except Exception:
        return []


async def get_doctor_by_user_id(user_id: str) -> dict | None:
    """Get doctor profile by user_id."""
    db = get_supabase()
    if not db:
        return None
    try:
        result = (
            db.table("doctors")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception:
        return None


async def get_doctor_by_id(doctor_id: str) -> dict | None:
    """Get doctor by doctor table id."""
    db = get_supabase()
    if not db:
        return None
    try:
        result = (
            db.table("doctors")
            .select("*")
            .eq("id", doctor_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception:
        return None


# ── Appointment CRUD ───────────────────────────────────────────────────────────

async def create_appointment(
    doctor_id: str,
    patient_id: str,
    patient_name: str,
    patient_email: str,
    date: str,
    time_slot: str,
    notes: str = "",
) -> dict | None:
    """Book a new appointment. Returns the created appointment or None."""
    db = get_supabase()
    if not db:
        return None
    try:
        result = db.table("appointments").insert({
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "patient_email": patient_email,
            "date": date,
            "time_slot": time_slot,
            "status": "pending",
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return result.data[0] if result.data else None
    except Exception:
        return None


async def get_user_appointments(user_id: str) -> list[dict]:
    """Get all appointments for a user (patient)."""
    db = get_supabase()
    if not db:
        return []
    try:
        result = (
            db.table("appointments")
            .select("*, doctors(full_name, specialization)")
            .eq("patient_id", user_id)
            .order("date", desc=True)
            .execute()
        )
        return result.data or []
    except Exception:
        return []


async def get_doctor_appointments(doctor_id: str, status: str | None = None) -> list[dict]:
    """Get all appointments for a doctor, optionally filtered by status."""
    db = get_supabase()
    if not db:
        return []
    try:
        query = (
            db.table("appointments")
            .select("*")
            .eq("doctor_id", doctor_id)
        )
        if status:
            query = query.eq("status", status)
        result = query.order("date", desc=True).execute()
        return result.data or []
    except Exception:
        return []


async def update_appointment_status(appointment_id: str, status: str) -> bool:
    """Update appointment status (confirm, cancel, complete)."""
    db = get_supabase()
    if not db:
        return False
    try:
        db.table("appointments").update({
            "status": status,
        }).eq("id", appointment_id).execute()
        return True
    except Exception:
        return False


async def get_admin_stats(doctor_id: str) -> dict:
    """Get dashboard statistics for a doctor."""
    db = get_supabase()
    if not db:
        return {"total_patients": 0, "today_appointments": 0, "completed": 0, "pending": 0}
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # All appointments for this doctor
        all_appts = (
            db.table("appointments")
            .select("id, status, date, patient_id")
            .eq("doctor_id", doctor_id)
            .execute()
        )
        data = all_appts.data or []

        unique_patients = set(row["patient_id"] for row in data if row.get("patient_id"))
        today_appts = [row for row in data if row.get("date") == today]
        completed = [row for row in data if row.get("status") == "completed"]
        pending = [row for row in data if row.get("status") == "pending"]

        return {
            "total_patients": len(unique_patients),
            "today_appointments": len(today_appts),
            "completed": len(completed),
            "pending": len(pending),
        }
    except Exception:
        return {"total_patients": 0, "today_appointments": 0, "completed": 0, "pending": 0}
