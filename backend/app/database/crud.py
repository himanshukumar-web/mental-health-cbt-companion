from datetime import datetime, timezone
import uuid
from app.database.client import get_supabase
from app.utils.security import encrypt_message, decrypt_message
from app.config import settings


# ── In-Memory Datastore Fallback ──────────────────────────────────────────────
# Used automatically if the Supabase tables do not exist yet.
MOCK_DOCTORS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "user_id": "00000000-0000-0000-0000-000000000000",
        "full_name": "Himanshu Kumar",
        "specialization": "Senior CBT Therapist & Anxiety Specialist",
        "bio": "Experienced mental health professional specializing in cognitive behavioral therapy, anxiety management, and thought challenging.",
        "experience_years": 8,
        "available": True,
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
]

MOCK_APPOINTMENTS = []
MOCK_DIRECT_MESSAGES = []


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
    if db:
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
            if result.data:
                return result.data[0]
        except Exception:
            pass

    # Fallback to Mock Store
    for doc in MOCK_DOCTORS:
        if doc["user_id"] == user_id:
            doc["full_name"] = full_name
            doc["specialization"] = specialization
            doc["bio"] = bio
            doc["experience_years"] = experience_years
            return doc

    new_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "full_name": full_name,
        "specialization": specialization,
        "bio": bio,
        "experience_years": experience_years,
        "available": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    MOCK_DOCTORS.append(new_doc)
    return new_doc


async def get_doctors(available_only: bool = True) -> list[dict]:
    """List all doctors, optionally only available ones."""
    db = get_supabase()
    if db:
        try:
            query = db.table("doctors").select("*")
            if available_only:
                query = query.eq("available", True)
            result = query.order("full_name").execute()
            if result.data is not None:
                return result.data
        except Exception:
            pass

    # Fallback to Mock Store
    if available_only:
        return [d for d in MOCK_DOCTORS if d["available"]]
    return MOCK_DOCTORS


async def get_doctor_by_user_id(user_id: str) -> dict | None:
    """Get doctor profile by user_id."""
    db = get_supabase()
    if db:
        try:
            result = (
                db.table("doctors")
                .select("*")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if result.data:
                return result.data[0]
        except Exception:
            pass

    # Fallback to Mock Store
    for d in MOCK_DOCTORS:
        if d["user_id"] == user_id:
            return d
    return None


async def get_doctor_by_id(doctor_id: str) -> dict | None:
    """Get doctor by doctor table id."""
    db = get_supabase()
    if db:
        try:
            result = (
                db.table("doctors")
                .select("*")
                .eq("id", doctor_id)
                .limit(1)
                .execute()
            )
            if result.data:
                return result.data[0]
        except Exception:
            pass

    # Fallback to Mock Store
    for d in MOCK_DOCTORS:
        if d["id"] == doctor_id:
            return d
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
    if db:
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
            if result.data:
                return result.data[0]
        except Exception:
            pass

    # Fallback to Mock Store
    new_appt = {
        "id": str(uuid.uuid4()),
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "patient_name": patient_name,
        "patient_email": patient_email,
        "date": date,
        "time_slot": time_slot,
        "status": "pending",
        "notes": notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    MOCK_APPOINTMENTS.append(new_appt)
    return new_appt


async def get_user_appointments(user_id: str) -> list[dict]:
    """Get all appointments for a user (patient)."""
    db = get_supabase()
    if db:
        try:
            result = (
                db.table("appointments")
                .select("*, doctors(full_name, specialization, user_id)")
                .eq("patient_id", user_id)
                .order("date", desc=True)
                .execute()
            )
            if result.data is not None:
                return result.data
        except Exception:
            pass

    # Fallback to Mock Store
    res = []
    for appt in MOCK_APPOINTMENTS:
        if appt["patient_id"] == user_id:
            doc_details = {"full_name": "Doctor", "specialization": "Therapist", "user_id": None}
            for d in MOCK_DOCTORS:
                if d["id"] == appt["doctor_id"]:
                    doc_details = {"full_name": d["full_name"], "specialization": d["specialization"], "user_id": d["user_id"]}
                    break
            appt_copy = appt.copy()
            appt_copy["doctors"] = doc_details
            res.append(appt_copy)
    return sorted(res, key=lambda x: x["date"], reverse=True)


async def get_doctor_appointments(doctor_id: str, status: str | None = None) -> list[dict]:
    """Get all appointments for a doctor, optionally filtered by status."""
    db = get_supabase()
    if db:
        try:
            query = (
                db.table("appointments")
                .select("*")
                .eq("doctor_id", doctor_id)
            )
            if status:
                query = query.eq("status", status)
            result = query.order("date", desc=True).execute()
            if result.data is not None:
                return result.data
        except Exception:
            pass

    # Fallback to Mock Store
    res = []
    for appt in MOCK_APPOINTMENTS:
        if appt["doctor_id"] == doctor_id:
            if not status or appt["status"] == status:
                res.append(appt)
    return sorted(res, key=lambda x: x["date"], reverse=True)


async def update_appointment_status(appointment_id: str, status: str) -> bool:
    """Update appointment status (confirm, cancel, complete)."""
    db = get_supabase()
    if db:
        try:
            db.table("appointments").update({
                "status": status,
            }).eq("id", appointment_id).execute()
            return True
        except Exception:
            pass

    # Fallback to Mock Store
    for appt in MOCK_APPOINTMENTS:
        if appt["id"] == appointment_id:
            appt["status"] = status
            return True
    return False


async def get_admin_stats(doctor_id: str) -> dict:
    """Get dashboard statistics for a doctor."""
    db = get_supabase()
    if db:
        try:
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
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
            pass

    # Fallback to Mock Store
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc_appts = [a for a in MOCK_APPOINTMENTS if a["doctor_id"] == doctor_id]
    unique_patients = len(set(a["patient_id"] for a in doc_appts if a.get("patient_id")))
    today_appts = len([a for a in doc_appts if a["date"] == today])
    completed = len([a for a in doc_appts if a["status"] == "completed"])
    pending = len([a for a in doc_appts if a["status"] == "pending"])
    return {
        "total_patients": unique_patients,
        "today_appointments": today_appts,
        "completed": completed,
        "pending": pending,
    }


# ── Direct Message CRUD ────────────────────────────────────────────────────────

async def create_direct_message(sender_id: str, receiver_id: str, content: str) -> dict | None:
    """Save a direct message between doctor and patient."""
    db = get_supabase()
    if db:
        try:
            result = db.table("direct_messages").insert({
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "content": content,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    # Fallback to Mock Store
    new_msg = {
        "id": str(uuid.uuid4()),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    MOCK_DIRECT_MESSAGES.append(new_msg)
    return new_msg


async def get_direct_messages(user1_id: str, user2_id: str, limit: int = 50) -> list[dict]:
    """Get message history between two users."""
    db = get_supabase()
    if db:
        try:
            result = (
                db.table("direct_messages")
                .select("*")
                .or_(f"and(sender_id.eq.{user1_id},receiver_id.eq.{user2_id}),and(sender_id.eq.{user2_id},receiver_id.eq.{user1_id})")
                .order("timestamp")
                .limit(limit)
                .execute()
            )
            if result.data is not None:
                return result.data
        except Exception:
            pass

    # Fallback to Mock Store
    res = []
    for msg in MOCK_DIRECT_MESSAGES:
        u1, u2 = msg["sender_id"], msg["receiver_id"]
        if (u1 == user1_id and u2 == user2_id) or (u1 == user2_id and u2 == user1_id):
            res.append(msg)
    res.sort(key=lambda x: x["timestamp"])
    return res[-limit:]


async def get_chat_partners(user_id: str) -> list[dict]:
    """Get list of users who have chatted with the current user."""
    partners = set()
    db = get_supabase()

    if db:
        try:
            sent = db.table("direct_messages").select("receiver_id").eq("sender_id", user_id).execute()
            rcvd = db.table("direct_messages").select("sender_id").eq("receiver_id", user_id).execute()
            for r in sent.data or []: partners.add(r["receiver_id"])
            for r in rcvd.data or []: partners.add(r["sender_id"])
        except Exception:
            pass

    # Add from mock messages
    for msg in MOCK_DIRECT_MESSAGES:
        if msg["sender_id"] == user_id:
            partners.add(msg["receiver_id"])
        elif msg["receiver_id"] == user_id:
            partners.add(msg["sender_id"])

    # Add patient/doctor IDs from appointments to make them easily discoverable
    if db:
        try:
            appts_patient = db.table("appointments").select("doctor_id, doctors(user_id, full_name)").eq("patient_id", user_id).execute()
            for a in appts_patient.data or []:
                if a.get("doctors") and a["doctors"].get("user_id"):
                    partners.add(a["doctors"]["user_id"])
            
            doc = db.table("doctors").select("id").eq("user_id", user_id).execute()
            if doc.data:
                appts_doc = db.table("appointments").select("patient_id").eq("doctor_id", doc.data[0]["id"]).execute()
                for a in appts_doc.data or []:
                    if a.get("patient_id"):
                        partners.add(a["patient_id"])
        except Exception:
            pass

    # Add from mock appointments
    for a in MOCK_APPOINTMENTS:
        for doc in MOCK_DOCTORS:
            if doc["user_id"] == user_id and a["doctor_id"] == doc["id"]:
                if a.get("patient_id"):
                    partners.add(a["patient_id"])
        if a["patient_id"] == user_id:
            for doc in MOCK_DOCTORS:
                if doc["id"] == a["doctor_id"]:
                    partners.add(doc["user_id"])

    result_partners = []

    for p_id in partners:
        name = "User"
        role = "patient"
        
        for doc in MOCK_DOCTORS:
            if doc["user_id"] == p_id:
                name = doc["full_name"]
                role = "doctor"
                break
        
        if role == "patient":
            for a in MOCK_APPOINTMENTS:
                if a.get("patient_id") == p_id:
                    name = a["patient_name"]
                    break
            if name == "User" and db:
                try:
                    appt = db.table("appointments").select("patient_name").eq("patient_id", p_id).limit(1).execute()
                    if appt.data:
                        name = appt.data[0]["patient_name"]
                except Exception:
                    pass

        result_partners.append({
            "user_id": p_id,
            "name": name,
            "role": role
        })
        
    return result_partners
