from datetime import datetime, timezone
import uuid
import sqlite3
import os
from app.database.client import get_supabase
from app.utils.security import encrypt_message, decrypt_message
from app.config import settings

# ── SQLite Datastore Fallback ──────────────────────────────────────────────────
# Used automatically if the Supabase tables do not exist yet.
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "local_fallback.db")

def init_sqlite():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Create doctors table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE,
        full_name TEXT NOT NULL,
        specialization TEXT DEFAULT 'General CBT Therapist',
        bio TEXT,
        experience_years INTEGER DEFAULT 0,
        available BOOLEAN DEFAULT 1,
        created_at TEXT
    )
    """)
    # Create appointments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        doctor_id TEXT NOT NULL,
        patient_id TEXT,
        patient_name TEXT NOT NULL,
        patient_email TEXT NOT NULL,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TEXT,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    )
    """)
    # Create direct_messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS direct_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT
    )
    """)
    
    # Initialize with default doctor if empty
    cursor.execute("SELECT COUNT(*) FROM doctors")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO doctors (id, user_id, full_name, specialization, bio, experience_years, available, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "11111111-1111-1111-1111-111111111111",
            "00000000-0000-0000-0000-000000000000",
            "Himanshu Kumar",
            "Senior CBT Therapist & Anxiety Specialist",
            "Experienced mental health professional specializing in cognitive behavioral therapy, anxiety management, and thought challenging.",
            8,
            1,
            datetime.now(timezone.utc).isoformat()
        ))
        
    conn.commit()
    conn.close()

# Run initialization
init_sqlite()


def sqlite_create_doctor(user_id, full_name, specialization, bio, experience_years, available=True):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    doc_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        # Auto-link logic: Check if default mock doctor exists under placeholder user_id '00000000-0000-0000-0000-000000000000'
        cursor.execute("SELECT id FROM doctors WHERE user_id='00000000-0000-0000-0000-000000000000'")
        placeholder = cursor.fetchone()
        if placeholder:
            # If the logged-in doctor has a different user_id, update placeholder to doctor's actual auth user_id
            cursor.execute("""
            UPDATE doctors SET 
                user_id=?, 
                full_name=?, 
                specialization=?, 
                bio=?, 
                experience_years=?, 
                available=? 
            WHERE user_id='00000000-0000-0000-0000-000000000000'
            """, (user_id, full_name, specialization, bio, experience_years, 1 if available else 0))
            
            # Also migrate any direct messages sent to/from the placeholder doctor to the actual doctor user_id
            cursor.execute("UPDATE direct_messages SET sender_id=? WHERE sender_id='00000000-0000-0000-0000-000000000000'", (user_id,))
            cursor.execute("UPDATE direct_messages SET receiver_id=? WHERE receiver_id='00000000-0000-0000-0000-000000000000'", (user_id,))
            conn.commit()
        else:
            # Regular insert/update for other doctor accounts
            cursor.execute("""
            INSERT INTO doctors (id, user_id, full_name, specialization, bio, experience_years, available, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                full_name=excluded.full_name,
                specialization=excluded.specialization,
                bio=excluded.bio,
                experience_years=excluded.experience_years,
                available=excluded.available
            """, (doc_id, user_id, full_name, specialization, bio, experience_years, 1 if available else 0, created_at))
            conn.commit()

        cursor.execute("SELECT id, user_id, full_name, specialization, bio, experience_years, available, created_at FROM doctors WHERE user_id=?", (user_id,))
        row = cursor.fetchone()
        return {
            "id": row[0], "user_id": row[1], "full_name": row[2], "specialization": row[3],
            "bio": row[4], "experience_years": row[5], "available": bool(row[6]), "created_at": row[7]
        }
    except Exception as e:
        print("SQLite error:", e)
        return None
    finally:
        conn.close()


def sqlite_get_doctors(available_only=True):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        if available_only:
            cursor.execute("SELECT id, user_id, full_name, specialization, bio, experience_years, available, created_at FROM doctors WHERE available=1 ORDER BY full_name")
        else:
            cursor.execute("SELECT id, user_id, full_name, specialization, bio, experience_years, available, created_at FROM doctors ORDER BY full_name")
        rows = cursor.fetchall()
        return [{
            "id": r[0], "user_id": r[1], "full_name": r[2], "specialization": r[3],
            "bio": r[4], "experience_years": r[5], "available": bool(r[6]), "created_at": r[7]
        } for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


def sqlite_get_doctor_by_user_id(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, user_id, full_name, specialization, bio, experience_years, available, created_at FROM doctors WHERE user_id=?", (user_id,))
        row = cursor.fetchone()
        if row:
            return {
                "id": row[0], "user_id": row[1], "full_name": row[2], "specialization": row[3],
                "bio": row[4], "experience_years": row[5], "available": bool(row[6]), "created_at": row[7]
            }
        return None
    except Exception:
        return None
    finally:
        conn.close()


def sqlite_get_doctor_by_id(doctor_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, user_id, full_name, specialization, bio, experience_years, available, created_at FROM doctors WHERE id=?", (doctor_id,))
        row = cursor.fetchone()
        if row:
            return {
                "id": row[0], "user_id": row[1], "full_name": row[2], "specialization": row[3],
                "bio": row[4], "experience_years": row[5], "available": bool(row[6]), "created_at": row[7]
            }
        return None
    except Exception:
        return None
    finally:
        conn.close()


def sqlite_create_appointment(doctor_id, patient_id, patient_name, patient_email, date, time_slot, notes=""):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    appt_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        cursor.execute("""
        INSERT INTO appointments (id, doctor_id, patient_id, patient_name, patient_email, date, time_slot, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        """, (appt_id, doctor_id, patient_id, patient_name, patient_email, date, time_slot, notes, created_at))
        conn.commit()
        return {
            "id": appt_id, "doctor_id": doctor_id, "patient_id": patient_id, "patient_name": patient_name,
            "patient_email": patient_email, "date": date, "time_slot": time_slot, "status": "pending",
            "notes": notes, "created_at": created_at
        }
    except Exception as e:
        print("SQLite appt create error:", e)
        return None
    finally:
        conn.close()


def sqlite_get_user_appointments(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, doctor_id, patient_id, patient_name, patient_email, date, time_slot, status, notes, created_at FROM appointments WHERE patient_id=? ORDER BY date DESC", (user_id,))
        rows = cursor.fetchall()
        res = []
        for r in rows:
            cursor.execute("SELECT full_name, specialization, user_id FROM doctors WHERE id=?", (r[1],))
            doc_row = cursor.fetchone()
            doc_details = {"full_name": "Doctor", "specialization": "Therapist", "user_id": None}
            if doc_row:
                doc_details = {"full_name": doc_row[0], "specialization": doc_row[1], "user_id": doc_row[2]}
            
            res.append({
                "id": r[0], "doctor_id": r[1], "patient_id": r[2], "patient_name": r[3],
                "patient_email": r[4], "date": r[5], "time_slot": r[6], "status": r[7],
                "notes": r[8], "created_at": r[9], "doctors": doc_details
            })
        return res
    except Exception:
        return []
    finally:
        conn.close()


def sqlite_get_doctor_appointments(doctor_id, status=None):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        if status:
            cursor.execute("SELECT id, doctor_id, patient_id, patient_name, patient_email, date, time_slot, status, notes, created_at FROM appointments WHERE doctor_id=? AND status=? ORDER BY date DESC", (doctor_id, status))
        else:
            cursor.execute("SELECT id, doctor_id, patient_id, patient_name, patient_email, date, time_slot, status, notes, created_at FROM appointments WHERE doctor_id=? ORDER BY date DESC", (doctor_id,))
        rows = cursor.fetchall()
        return [{
            "id": r[0], "doctor_id": r[1], "patient_id": r[2], "patient_name": r[3],
            "patient_email": r[4], "date": r[5], "time_slot": r[6], "status": r[7],
            "notes": r[8], "created_at": r[9]
        } for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


def sqlite_update_appointment_status(appointment_id, status):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE appointments SET status=? WHERE id=?", (status, appointment_id))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def sqlite_create_direct_message(sender_id, receiver_id, content):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    msg_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        cursor.execute("""
        INSERT INTO direct_messages (id, sender_id, receiver_id, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
        """, (msg_id, sender_id, receiver_id, content, timestamp))
        conn.commit()
        return {
            "id": msg_id, "sender_id": sender_id, "receiver_id": receiver_id,
            "content": content, "timestamp": timestamp
        }
    except Exception:
        return None
    finally:
        conn.close()


def sqlite_get_direct_messages(user1_id, user2_id, limit=50):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT id, sender_id, receiver_id, content, timestamp FROM direct_messages
        WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
        ORDER BY timestamp ASC
        """, (user1_id, user2_id, user2_id, user1_id))
        rows = cursor.fetchall()
        msgs = [{
            "id": r[0], "sender_id": r[1], "receiver_id": r[2],
            "content": r[3], "timestamp": r[4]
        } for r in rows]
        return msgs[-limit:]
    except Exception:
        return []
    finally:
        conn.close()


def sqlite_get_chat_partners(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    partners = set()
    try:
        cursor.execute("SELECT receiver_id FROM direct_messages WHERE sender_id=?", (user_id,))
        for r in cursor.fetchall(): partners.add(r[0])
        cursor.execute("SELECT sender_id FROM direct_messages WHERE receiver_id=?", (user_id,))
        for r in cursor.fetchall(): partners.add(r[0])
        
        cursor.execute("SELECT doctor_id FROM appointments WHERE patient_id=?", (user_id,))
        for r in cursor.fetchall():
            cursor.execute("SELECT user_id FROM doctors WHERE id=?", (r[0],))
            doc = cursor.fetchone()
            if doc: partners.add(doc[0])
            
        cursor.execute("SELECT id FROM doctors WHERE user_id=?", (user_id,))
        doc = cursor.fetchone()
        if doc:
            cursor.execute("SELECT patient_id FROM appointments WHERE doctor_id=?", (doc[0],))
            for r in cursor.fetchall():
                if r[0]: partners.add(r[0])
                
        res = []
        for p_id in partners:
            cursor.execute("SELECT full_name FROM doctors WHERE user_id=?", (p_id,))
            doc_row = cursor.fetchone()
            name = "User"
            role = "patient"
            if doc_row:
                name = doc_row[0]
                role = "doctor"
            else:
                cursor.execute("SELECT patient_name FROM appointments WHERE patient_id=? LIMIT 1", (p_id,))
                appt_row = cursor.fetchone()
                if appt_row: name = appt_row[0]
            
            res.append({
                "user_id": p_id,
                "name": name,
                "role": role
            })
        return res
    except Exception:
        return []
    finally:
        conn.close()


# ── Core API Handlers ─────────────────────────────────────────────────────────

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

    # Fallback to local SQLite Database
    return sqlite_create_doctor(user_id, full_name, specialization, bio, experience_years)


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

    # Fallback to local SQLite Database
    return sqlite_get_doctors(available_only)


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

    # Fallback to local SQLite Database
    return sqlite_get_doctor_by_user_id(user_id)


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

    # Fallback to local SQLite Database
    return sqlite_get_doctor_by_id(doctor_id)


async def update_doctor_profile(
    user_id: str,
    full_name: str,
    specialization: str,
    bio: str,
    experience_years: int,
    available: bool = True
) -> dict | None:
    """Update an existing doctor profile."""
    db = get_supabase()
    if db:
        try:
            result = db.table("doctors").update({
                "full_name": full_name,
                "specialization": specialization,
                "bio": bio,
                "experience_years": experience_years,
                "available": available,
            }).eq("user_id", user_id).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    # Fallback to local SQLite Database
    return sqlite_create_doctor(user_id, full_name, specialization, bio, experience_years, available)


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

    # Fallback to local SQLite Database
    return sqlite_create_appointment(doctor_id, patient_id, patient_name, patient_email, date, time_slot, notes)


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

    # Fallback to local SQLite Database
    return sqlite_get_user_appointments(user_id)


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

    # Fallback to local SQLite Database
    return sqlite_get_doctor_appointments(doctor_id, status)


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

    # Fallback to local SQLite Database
    return sqlite_update_appointment_status(appointment_id, status)


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

    # Fallback to local SQLite Database
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc_appts = sqlite_get_doctor_appointments(doctor_id)
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

    # Fallback to local SQLite Database
    return sqlite_create_direct_message(sender_id, receiver_id, content)


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

    # Fallback to local SQLite Database
    return sqlite_get_direct_messages(user1_id, user2_id, limit)


async def get_chat_partners(user_id: str) -> list[dict]:
    """Get list of users who have chatted with the current user."""
    db = get_supabase()
    if db:
        try:
            sent = db.table("direct_messages").select("receiver_id").eq("sender_id", user_id).execute()
            rcvd = db.table("direct_messages").select("sender_id").eq("receiver_id", user_id).execute()
            partners = set()
            for r in sent.data or []: partners.add(r["receiver_id"])
            for r in rcvd.data or []: partners.add(r["sender_id"])
            
            # Fetch names
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
                        
            result_partners = []
            for p_id in partners:
                name = "User"
                role = "patient"
                doc_query = db.table("doctors").select("full_name").eq("user_id", p_id).execute()
                if doc_query.data:
                    name = doc_query.data[0]["full_name"]
                    role = "doctor"
                else:
                    appt_query = db.table("appointments").select("patient_name").eq("patient_id", p_id).limit(1).execute()
                    if appt_query.data:
                        name = appt_query.data[0]["patient_name"]
                result_partners.append({"user_id": p_id, "name": name, "role": role})
            return result_partners
        except Exception:
            pass

    # Fallback to local SQLite Database
    return sqlite_get_chat_partners(user_id)
