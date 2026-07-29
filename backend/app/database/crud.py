from datetime import datetime, timezone
import json
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
    # Create sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        mood_score INTEGER,
        started_at TEXT
    )
    """)
    # Migration: add user_id to sessions if missing
    try:
        cursor.execute("ALTER TABLE sessions ADD COLUMN user_id TEXT")
        conn.commit()
    except Exception:
        pass
    # Create messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content_encrypted TEXT NOT NULL,
        threat_level TEXT DEFAULT 'normal',
        timestamp TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
    """)
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
    # Create notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)
    
    # Migration: add persona to sessions if missing
    try:
        cursor.execute("ALTER TABLE sessions ADD COLUMN persona TEXT DEFAULT 'cbt'")
        conn.commit()
    except Exception:
        pass

    # Create user_persona_preferences table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_persona_preferences (
        user_id TEXT PRIMARY KEY,
        persona_id TEXT NOT NULL DEFAULT 'cbt',
        updated_at TEXT
    )
    """)

    # Create phq9_assessments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS phq9_assessments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        risk_category TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        ai_explanation TEXT,
        created_at TEXT
    )
    """)

    # Create gad7_assessments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gad7_assessments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        anxiety_level TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        ai_explanation TEXT,
        created_at TEXT
    )
    """)

    # Create ai_memories table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        memory_text TEXT NOT NULL,
        weight INTEGER DEFAULT 1,
        updated_at TEXT
    )
    """)

    # Create wellness_scores table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wellness_scores (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        total_score INTEGER NOT NULL,
        breakdown_json TEXT NOT NULL,
        created_at TEXT
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
        cursor.execute("SELECT sender_id, receiver_id FROM direct_messages WHERE sender_id=? OR receiver_id=?", (user_id, user_id))
        for r in cursor.fetchall():
            partners.add(r[1] if r[0] == user_id else r[0])
            
        cursor.execute("SELECT id FROM doctors WHERE user_id=?", (user_id,))
        doc = cursor.fetchone()
        if doc:
            cursor.execute("SELECT patient_id FROM appointments WHERE doctor_id=?", (doc[0],))
            for r in cursor.fetchall():
                if r[0]: partners.add(r[0])
        else:
            cursor.execute("""
                SELECT d.user_id FROM appointments a
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.patient_id=?
            """, (user_id,))
            for r in cursor.fetchall():
                if r[0]: partners.add(r[0])
                
        res = []
        if not partners:
            return []
            
        p_list = list(partners)
        placeholders = ",".join("?" for _ in p_list)
        cursor.execute(f"SELECT user_id, full_name FROM doctors WHERE user_id IN ({placeholders})", p_list)
        docs_map = {r[0]: r[1] for r in cursor.fetchall()}
        
        remaining_ids = [p_id for p_id in p_list if p_id not in docs_map]
        patients_map = {}
        if remaining_ids:
            ph2 = ",".join("?" for _ in remaining_ids)
            cursor.execute(f"SELECT patient_id, patient_name FROM appointments WHERE patient_id IN ({ph2})", remaining_ids)
            for r in cursor.fetchall():
                patients_map[r[0]] = r[1]
                
        for p_id in p_list:
            if p_id in docs_map:
                res.append({
                    "user_id": p_id,
                    "name": docs_map[p_id],
                    "role": "doctor"
                })
            else:
                res.append({
                    "user_id": p_id,
                    "name": patients_map.get(p_id, "User"),
                    "role": "patient"
                })
        return res
    except Exception as e:
        print("sqlite_get_chat_partners error:", e)
        return []
    finally:
        conn.close()


def sqlite_create_session(session_id, mood_score=None, user_id=None):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    started_at = datetime.now(timezone.utc).isoformat()
    try:
        cursor.execute("""
        INSERT INTO sessions (id, user_id, mood_score, started_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET mood_score=excluded.mood_score, user_id=coalesce(excluded.user_id, sessions.user_id)
        """, (session_id, user_id, mood_score, started_at))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def sqlite_save_message(session_id, role, content, threat_level="normal", user_id=None):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    msg_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        # Check if session exists, if not create it
        cursor.execute("SELECT id FROM sessions WHERE id=?", (session_id,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO sessions (id, user_id, started_at) VALUES (?, ?, ?)", (session_id, user_id, timestamp))
        elif user_id:
            cursor.execute("UPDATE sessions SET user_id=? WHERE id=?", (user_id, session_id))
            
        encrypted = encrypt_message(content, settings.encryption_key)
        cursor.execute("""
        INSERT INTO messages (id, session_id, role, content_encrypted, threat_level, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (msg_id, session_id, role, encrypted, threat_level, timestamp))
        conn.commit()
        return True
    except Exception as e:
        print("sqlite save message error:", e)
        return False
    finally:
        conn.close()


def sqlite_get_session_history(session_id, limit=20):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT role, content_encrypted, timestamp FROM messages
        WHERE session_id=?
        ORDER BY timestamp ASC
        """, (session_id,))
        rows = cursor.fetchall()
        messages = []
        for r in rows:
            try:
                content = decrypt_message(r[1], settings.encryption_key)
                messages.append({"role": r[0], "content": content})
            except Exception:
                pass
        return messages[-limit:]
    except Exception:
        return []
    finally:
        conn.close()


# ── Meditation Sessions & XP Gamification ──────────────────────────────────────

async def create_meditation_session(user_id: str, category: str, title: str, duration_minutes: int) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    session_id = str(uuid.uuid4())
    entry = {
        "id": session_id, "user_id": user_id, "category": category,
        "title": title, "duration_minutes": duration_minutes, "completed_at": now,
    }
    db = get_supabase()
    if db:
        try:
            db.table("notifications").insert({
                "user_id": user_id, "type": "meditation_completed",
                "title": "Meditation Completed! 🧘",
                "message": f"Completed {duration_minutes}m of '{title}' (+150 XP)",
                "is_read": False, "created_at": now,
            }).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS meditation_sessions (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT,
            title TEXT, duration_minutes INTEGER, completed_at TEXT
        )""")
        cursor.execute("""
        INSERT INTO meditation_sessions (id, user_id, category, title, duration_minutes, completed_at)
        VALUES (?, ?, ?, ?, ?, ?)""", (session_id, user_id, category, title, duration_minutes, now))
        conn.commit()
    except Exception as e:
        print("SQLite meditation session error:", e)
    finally:
        conn.close()

    # Award +150 XP for completing meditation
    await add_user_xp(user_id, 150, "meditation_session")
    return entry


async def get_user_meditation_minutes(user_id: str) -> int:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT SUM(duration_minutes) FROM meditation_sessions WHERE user_id=?", (user_id,))
        res = cursor.fetchone()
        return res[0] or 0 if res else 0
    except Exception:
        return 0
    finally:
        conn.close()


async def add_user_xp(user_id: str, xp_amount: int, source: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_xp (
            user_id TEXT PRIMARY KEY, total_xp INTEGER DEFAULT 0, updated_at TEXT
        )""")
        cursor.execute("SELECT total_xp FROM user_xp WHERE user_id=?", (user_id,))
        row = cursor.fetchone()
        current_xp = row[0] if row else 0
        new_xp = current_xp + xp_amount

        cursor.execute("""
        INSERT INTO user_xp (user_id, total_xp, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET total_xp=excluded.total_xp, updated_at=excluded.updated_at
        """, (user_id, new_xp, now))
        conn.commit()
        level = (new_xp // 500) + 1
        return {"user_id": user_id, "total_xp": new_xp, "level": level, "xp_gained": xp_amount}
    except Exception as e:
        print("SQLite XP error:", e)
        return {"user_id": user_id, "total_xp": 0, "level": 1, "xp_gained": xp_amount}
    finally:
        conn.close()


async def get_user_xp(user_id: str) -> dict:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT total_xp FROM user_xp WHERE user_id=?", (user_id,))
        row = cursor.fetchone()
        xp = row[0] if row else 0
        level = (xp // 500) + 1
        return {"user_id": user_id, "total_xp": xp, "level": level, "next_level_xp": level * 500}
    except Exception:
        return {"user_id": user_id, "total_xp": 0, "level": 1, "next_level_xp": 500}
    finally:
        conn.close()


async def build_user_memory_context(user_id: str | None) -> str:
    """
    Retrieve long-term memory context for a user to inject into Sera AI system prompt.
    Includes profile goals, recent mood average, CBT patterns, habits, and meditation minutes.
    """
    if not user_id or user_id == "anonymous":
        return ""

    memory_parts = []
    try:
        # Profile goals
        profile = await get_user_profile(user_id)
        if profile and profile.get("wellness_goals"):
            memory_parts.append(f"- User Goals: {profile['wellness_goals']}")
        if profile and profile.get("display_name"):
            memory_parts.append(f"- Preferred Name: {profile['display_name']}")

        # Recent Moods
        moods = await get_mood_entries(user_id)
        if moods:
            avg_mood = sum(m.get("mood_score", 3) for m in moods[:7]) / len(moods[:7])
            memory_parts.append(f"- Recent 7-Day Average Mood: {avg_mood:.1f} / 5.0")
            if moods[0].get("notes"):
                memory_parts.append(f"- Latest Mood Note ({moods[0]['date']}): \"{moods[0]['notes'][:100]}\"")

        # Recent CBT Worksheets
        worksheets = await get_cbt_worksheets(user_id, limit=3)
        if worksheets:
            thoughts = [w.get("automatic_thought", "")[:60] for w in worksheets if w.get("automatic_thought")]
            if thoughts:
                memory_parts.append(f"- Recent Automatic Thoughts Reframed: {'; '.join(thoughts)}")

        # Meditation Minutes
        med_mins = await get_user_meditation_minutes(user_id)
        if med_mins > 0:
            memory_parts.append(f"- Total Meditation Completed: {med_mins} minutes")

    except Exception as e:
        print("Error constructing memory context:", e)

    if not memory_parts:
        return ""

    return (
        "\n\n=========================================\n"
        "USER LONG-TERM MEMORY & CONTEXT:\n"
        + "\n".join(memory_parts) + "\n"
        "Use this context naturally in conversation when appropriate to show that you remember their journey.\n"
        "=========================================\n"
    )


# ── Core API Handlers ─────────────────────────────────────────────────────────

async def create_session(session_id: str, mood_score: int | None = None, user_id: str | None = None) -> bool:
    """Create a new session row. Returns True on success."""
    db = get_supabase()
    if db:
        try:
            db.table("sessions").insert({
                "id": session_id,
                "user_id": user_id,
                "mood_score": mood_score,
                "started_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            return True
        except Exception:
            pass

    # Fallback to local SQLite
    return sqlite_create_session(session_id, mood_score, user_id)


async def save_message(
    session_id: str,
    role: str,
    content: str,
    threat_level: str = "normal",
    user_id: str | None = None,
) -> bool:
    """Encrypt and save a message to the database."""
    db = get_supabase()
    if db:
        try:
            # Check if session exists in Supabase
            try:
                res = db.table("sessions").select("id").eq("id", session_id).execute()
                if not res.data:
                    # Create session
                    db.table("sessions").insert({
                        "id": session_id,
                        "user_id": user_id,
                        "started_at": datetime.now(timezone.utc).isoformat(),
                    }).execute()
                elif user_id:
                    # Update session user_id in case it was created without it
                    db.table("sessions").update({"user_id": user_id}).eq("id", session_id).execute()
            except Exception as e:
                print("Supabase check/create session error:", e)

            encrypted = encrypt_message(content, settings.encryption_key)
            db.table("messages").insert({
                "session_id": session_id,
                "role": role,
                "content_encrypted": encrypted,
                "threat_level": threat_level,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }).execute()
            return True
        except Exception as e:
            print("Supabase save message error:", e)

    # Fallback to local SQLite
    return sqlite_save_message(session_id, role, content, threat_level, user_id)


async def get_session_history(session_id: str, limit: int = 20) -> list[dict]:
    """Return decrypted message history for a session."""
    db = get_supabase()
    if db:
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
            pass

    # Fallback to local SQLite
    return sqlite_get_session_history(session_id, limit)


def sqlite_get_user_sessions(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, mood_score, started_at FROM sessions WHERE user_id=? ORDER BY started_at DESC", (user_id,))
        rows = cursor.fetchall()
        sessions = []
        for r in rows:
            # Get first message
            cursor.execute("SELECT content_encrypted FROM messages WHERE session_id=? AND role='user' ORDER BY timestamp ASC LIMIT 1", (r[0],))
            msg = cursor.fetchone()
            title = "New Session"
            if msg:
                try:
                    content = decrypt_message(msg[0], settings.encryption_key)
                    title = content[:30] + "..." if len(content) > 30 else content
                except Exception:
                    pass
            sessions.append({
                "id": r[0],
                "started_at": r[2],
                "mood_score": r[1],
                "title": title
            })
        return sessions
    except Exception as e:
        print("sqlite_get_user_sessions error:", e)
        return []
    finally:
        conn.close()


async def get_user_sessions(user_id: str) -> list[dict]:
    """Get all sessions for a user, with first message content as the title."""
    db = get_supabase()
    if db:
        try:
            result = (
                db.table("sessions")
                .select("id, mood_score, started_at")
                .eq("user_id", user_id)
                .order("started_at", desc=True)
                .execute()
            )
            sessions = []
            for s in result.data:
                # Fetch first user message
                msg_res = (
                    db.table("messages")
                    .select("content_encrypted")
                    .eq("session_id", s["id"])
                    .eq("role", "user")
                    .order("timestamp")
                    .limit(1)
                    .execute()
                )
                title = "New Session"
                if msg_res.data:
                    try:
                        content = decrypt_message(msg_res.data[0]["content_encrypted"], settings.encryption_key)
                        title = content[:30] + "..." if len(content) > 30 else content
                    except Exception:
                        pass
                sessions.append({
                    "id": s["id"],
                    "started_at": s["started_at"],
                    "mood_score": s["mood_score"],
                    "title": title
                })
            return sessions
        except Exception as e:
            print("Supabase get_user_sessions error:", e)

    # Fallback to local SQLite
    return sqlite_get_user_sessions(user_id)


async def update_session_mood(session_id: str, mood_score: int) -> bool:
    """Update the mood score of a session."""
    db = get_supabase()
    if db:
        try:
            db.table("sessions").update({"mood_score": mood_score}).eq("id", session_id).execute()
            return True
        except Exception as e:
            print("Supabase update_session_mood error:", e)

    # Fallback to local SQLite
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE sessions SET mood_score=? WHERE id=?", (mood_score, session_id))
        conn.commit()
        return True
    except Exception as e:
        print("sqlite update_session_mood error:", e)
        return False
    finally:
        conn.close()


async def get_session_mood(session_id: str) -> int | None:
    """Retrieve the mood score of a session."""
    db = get_supabase()
    if db:
        try:
            res = db.table("sessions").select("mood_score").eq("id", session_id).execute()
            if res.data:
                return res.data[0].get("mood_score")
        except Exception:
            pass

    # Fallback SQLite
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT mood_score FROM sessions WHERE id=?", (session_id,))
        row = cursor.fetchone()
        if row and row[0] is not None:
            return int(row[0])
    except Exception:
        pass
    finally:
        conn.close()
    return None


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
            # Get direct messages using OR condition
            dm_query = db.table("direct_messages").select("sender_id, receiver_id").or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}").execute()
            partners = set()
            for r in dm_query.data or []:
                partners.add(r["receiver_id"] if str(r["sender_id"]) == user_id else r["sender_id"])
            
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
                        
            if not partners:
                return []
                
            p_list = list(partners)
            
            # Query all matching doctors in a single batch query!
            docs_query = db.table("doctors").select("user_id, full_name").in_("user_id", p_list).execute()
            docs_map = {d["user_id"]: d["full_name"] for d in docs_query.data or []}
            
            # Find which users are not doctors
            remaining_ids = [p_id for p_id in p_list if p_id not in docs_map]
            
            # Query all matching patient names in a single batch query!
            patients_map = {}
            if remaining_ids:
                appts_query = db.table("appointments").select("patient_id, patient_name").in_("patient_id", remaining_ids).execute()
                for a in appts_query.data or []:
                    patients_map[a["patient_id"]] = a["patient_name"]
                
            result_partners = []
            for p_id in p_list:
                if p_id in docs_map:
                    result_partners.append({"user_id": p_id, "name": docs_map[p_id], "role": "doctor"})
                else:
                    result_partners.append({"user_id": p_id, "name": patients_map.get(p_id, "User"), "role": "patient"})
            return result_partners
        except Exception as e:
            print("get_chat_partners error:", e)
            pass

    # Fallback to local SQLite Database
    return sqlite_get_chat_partners(user_id)


# ── Notification CRUD ──────────────────────────────────────────────────────────

def sqlite_create_notification(user_id, notif_type, title, message, link=None):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    notif_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        cursor.execute("""
        INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        """, (notif_id, user_id, notif_type, title, message, link, created_at))
        conn.commit()
        return {
            "id": notif_id, "user_id": user_id, "type": notif_type,
            "title": title, "message": message, "link": link,
            "is_read": False, "created_at": created_at
        }
    except Exception as e:
        print("sqlite_create_notification error:", e)
        return None
    finally:
        conn.close()


def sqlite_get_user_notifications(user_id, unread_only=False, limit=20):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        if unread_only:
            cursor.execute("""
            SELECT id, user_id, type, title, message, link, is_read, created_at
            FROM notifications WHERE user_id=? AND is_read=0
            ORDER BY created_at DESC LIMIT ?
            """, (user_id, limit))
        else:
            cursor.execute("""
            SELECT id, user_id, type, title, message, link, is_read, created_at
            FROM notifications WHERE user_id=?
            ORDER BY created_at DESC LIMIT ?
            """, (user_id, limit))
        rows = cursor.fetchall()
        return [{
            "id": r[0], "user_id": r[1], "type": r[2], "title": r[3],
            "message": r[4], "link": r[5], "is_read": bool(r[6]), "created_at": r[7]
        } for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


def sqlite_mark_notification_read(notification_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE notifications SET is_read=1 WHERE id=?", (notification_id,))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def sqlite_mark_all_notifications_read(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE notifications SET is_read=1 WHERE user_id=?", (user_id,))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def sqlite_get_appointment_by_id(appointment_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT id, doctor_id, patient_id, patient_name, patient_email, date, time_slot, status, notes, created_at
        FROM appointments WHERE id=?
        """, (appointment_id,))
        r = cursor.fetchone()
        if r:
            return {
                "id": r[0], "doctor_id": r[1], "patient_id": r[2], "patient_name": r[3],
                "patient_email": r[4], "date": r[5], "time_slot": r[6], "status": r[7],
                "notes": r[8], "created_at": r[9]
            }
        return None
    except Exception:
        return None
    finally:
        conn.close()


async def create_notification(
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    link: str | None = None,
) -> dict | None:
    """Create a notification for a user."""
    db = get_supabase()
    if db:
        try:
            result = db.table("notifications").insert({
                "user_id": user_id,
                "type": notif_type,
                "title": title,
                "message": message,
                "link": link,
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print("Supabase create_notification error:", e)

    return sqlite_create_notification(user_id, notif_type, title, message, link)


async def get_user_notifications(user_id: str, unread_only: bool = False, limit: int = 20) -> list[dict]:
    """Get notifications for a user."""
    db = get_supabase()
    if db:
        try:
            query = db.table("notifications").select("*").eq("user_id", user_id)
            if unread_only:
                query = query.eq("is_read", False)
            result = query.order("created_at", desc=True).limit(limit).execute()
            if result.data is not None:
                return result.data
        except Exception as e:
            print("Supabase get_user_notifications error:", e)

    return sqlite_get_user_notifications(user_id, unread_only, limit)


async def mark_notification_read(notification_id: str) -> bool:
    """Mark a single notification as read."""
    db = get_supabase()
    if db:
        try:
            db.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
            return True
        except Exception:
            pass

    return sqlite_mark_notification_read(notification_id)


async def mark_all_notifications_read(user_id: str) -> bool:
    """Mark all notifications as read for a user."""
    db = get_supabase()
    if db:
        try:
            db.table("notifications").update({"is_read": True}).eq("user_id", user_id).execute()
            return True
        except Exception:
            pass

    return sqlite_mark_all_notifications_read(user_id)


async def get_appointment_by_id(appointment_id: str) -> dict | None:
    """Get a single appointment by its ID."""
    db = get_supabase()
    if db:
        try:
            result = db.table("appointments").select("*").eq("id", appointment_id).limit(1).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    return sqlite_get_appointment_by_id(appointment_id)


# ── Mood Entries CRUD ──────────────────────────────────────────────────────────

def _init_sqlite_v2():
    """Initialize V2 tables in SQLite."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    tables = [
        """CREATE TABLE IF NOT EXISTS mood_entries (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL,
            mood_score INTEGER NOT NULL, mood_emoji TEXT DEFAULT '😐',
            stress_level INTEGER, anxiety_level INTEGER, energy_level INTEGER,
            sleep_hours REAL, water_intake INTEGER,
            exercise_done INTEGER DEFAULT 0, meditation_done INTEGER DEFAULT 0,
            notes TEXT, created_at TEXT, updated_at TEXT,
            UNIQUE(user_id, date))""",
        """CREATE TABLE IF NOT EXISTS journal_entries (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT DEFAULT '',
            content TEXT DEFAULT '', content_html TEXT,
            sentiment TEXT, sentiment_score REAL, emotions TEXT DEFAULT '{}',
            ai_summary TEXT, word_count INTEGER DEFAULT 0,
            is_favorite INTEGER DEFAULT 0,
            created_at TEXT, updated_at TEXT)""",
        """CREATE TABLE IF NOT EXISTS habit_definitions (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
            icon TEXT DEFAULT '✅', color TEXT DEFAULT '#22c55e',
            is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
            created_at TEXT)""",
        """CREATE TABLE IF NOT EXISTS habit_completions (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
            habit_definition_id TEXT NOT NULL, date TEXT NOT NULL,
            completed INTEGER DEFAULT 1, created_at TEXT,
            UNIQUE(user_id, habit_definition_id, date))""",
        """CREATE TABLE IF NOT EXISTS cbt_worksheets (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
            situation TEXT NOT NULL, automatic_thought TEXT NOT NULL,
            emotion TEXT NOT NULL, emotion_intensity INTEGER,
            thinking_errors TEXT DEFAULT '[]', alternative_thought TEXT,
            action_plan TEXT, ai_generated INTEGER DEFAULT 0,
            created_at TEXT)""",
        """CREATE TABLE IF NOT EXISTS action_plans (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT,
            breathing_exercise TEXT, walking_goal TEXT, hydration_goal TEXT,
            meditation_rec TEXT, journal_prompt TEXT, sleep_rec TEXT,
            motivational_msg TEXT, created_at TEXT)""",
        """CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
            display_name TEXT, avatar_url TEXT, age INTEGER,
            gender TEXT, timezone TEXT DEFAULT 'Asia/Kolkata',
            goals TEXT DEFAULT '[]', preferred_reminder_time TEXT DEFAULT '09:00',
            wellness_goals TEXT, created_at TEXT, updated_at TEXT)""",
        """CREATE TABLE IF NOT EXISTS reminders (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
            journal_enabled INTEGER DEFAULT 1, journal_time TEXT DEFAULT '20:00',
            meditation_enabled INTEGER DEFAULT 1, meditation_time TEXT DEFAULT '07:00',
            water_enabled INTEGER DEFAULT 1, water_interval INTEGER DEFAULT 60,
            sleep_enabled INTEGER DEFAULT 1, sleep_time TEXT DEFAULT '22:30',
            mood_enabled INTEGER DEFAULT 1, mood_time TEXT DEFAULT '21:00',
            created_at TEXT, updated_at TEXT)""",
        """CREATE TABLE IF NOT EXISTS user_settings (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
            theme TEXT DEFAULT 'dark', notifications_enabled INTEGER DEFAULT 1,
            email_notifications INTEGER DEFAULT 0, language TEXT DEFAULT 'en',
            data_sharing INTEGER DEFAULT 0, analytics_enabled INTEGER DEFAULT 1,
            created_at TEXT, updated_at TEXT)""",
    ]
    for sql in tables:
        cursor.execute(sql)
    conn.commit()
    conn.close()

_init_sqlite_v2()


DEFAULT_HABITS = [
    {"name": "Drink Water", "icon": "💧", "color": "#3b82f6"},
    {"name": "Exercise", "icon": "🏃", "color": "#22c55e"},
    {"name": "Meditation", "icon": "🧘", "color": "#8b5cf6"},
    {"name": "Journal", "icon": "📝", "color": "#f59e0b"},
    {"name": "Walk", "icon": "🚶", "color": "#06b6d4"},
    {"name": "Sleep Before 11 PM", "icon": "🌙", "color": "#6366f1"},
]


async def create_mood_entry(user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    entry_id = str(uuid.uuid4())
    entry = {
        "id": entry_id, "user_id": user_id,
        "date": data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "mood_score": data["mood_score"], "mood_emoji": data.get("mood_emoji", "😐"),
        "stress_level": data.get("stress_level"), "anxiety_level": data.get("anxiety_level"),
        "energy_level": data.get("energy_level"), "sleep_hours": data.get("sleep_hours"),
        "water_intake": data.get("water_intake"),
        "exercise_done": data.get("exercise_done", False),
        "meditation_done": data.get("meditation_done", False),
        "notes": data.get("notes", ""), "created_at": now, "updated_at": now,
    }
    db = get_supabase()
    if db:
        try:
            result = db.table("mood_entries").upsert(entry, on_conflict="user_id,date").execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print(f"Supabase mood entry error: {e}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO mood_entries (id,user_id,date,mood_score,mood_emoji,stress_level,anxiety_level,
        energy_level,sleep_hours,water_intake,exercise_done,meditation_done,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id,date) DO UPDATE SET
        mood_score=excluded.mood_score,mood_emoji=excluded.mood_emoji,
        stress_level=excluded.stress_level,anxiety_level=excluded.anxiety_level,
        energy_level=excluded.energy_level,sleep_hours=excluded.sleep_hours,
        water_intake=excluded.water_intake,exercise_done=excluded.exercise_done,
        meditation_done=excluded.meditation_done,notes=excluded.notes,updated_at=excluded.updated_at
        """, (entry_id, user_id, entry["date"], entry["mood_score"], entry["mood_emoji"],
              entry["stress_level"], entry["anxiety_level"], entry["energy_level"],
              entry["sleep_hours"], entry["water_intake"],
              1 if entry["exercise_done"] else 0, 1 if entry["meditation_done"] else 0,
              entry["notes"], now, now))
        conn.commit()
        return entry
    except Exception as e:
        print(f"SQLite mood entry error: {e}")
        return None
    finally:
        conn.close()


async def get_mood_entries(user_id: str, start_date: str | None = None, end_date: str | None = None) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            query = db.table("mood_entries").select("*").eq("user_id", user_id)
            if start_date:
                query = query.gte("date", start_date)
            if end_date:
                query = query.lte("date", end_date)
            result = query.order("date", desc=True).execute()
            return result.data or []
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        sql = "SELECT * FROM mood_entries WHERE user_id=?"
        params: list = [user_id]
        if start_date:
            sql += " AND date>=?"
            params.append(start_date)
        if end_date:
            sql += " AND date<=?"
            params.append(end_date)
        sql += " ORDER BY date DESC"
        cursor.execute(sql, params)
        cols = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(cols, r)) for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


async def delete_mood_entry(entry_id: str, user_id: str) -> bool:
    db = get_supabase()
    if db:
        try:
            db.table("mood_entries").delete().eq("id", entry_id).eq("user_id", user_id).execute()
            return True
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM mood_entries WHERE id=? AND user_id=?", (entry_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception:
        return False
    finally:
        conn.close()


# ── Journal Entries CRUD ───────────────────────────────────────────────────────

async def create_journal_entry(user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    entry_id = str(uuid.uuid4())
    content = data.get("content", "")
    entry = {
        "id": entry_id, "user_id": user_id,
        "title": data.get("title", ""),
        "content": content,
        "content_html": data.get("content_html"),
        "sentiment": data.get("sentiment"),
        "sentiment_score": data.get("sentiment_score"),
        "emotions": json.dumps(data.get("emotions", {})) if isinstance(data.get("emotions"), dict) else data.get("emotions", "{}"),
        "ai_summary": data.get("ai_summary"),
        "word_count": len(content.split()) if content else 0,
        "is_favorite": data.get("is_favorite", False),
        "created_at": now, "updated_at": now,
    }
    db = get_supabase()
    if db:
        try:
            sb_entry = {**entry}
            if isinstance(sb_entry.get("emotions"), str):
                sb_entry["emotions"] = json.loads(sb_entry["emotions"])
            result = db.table("journal_entries").insert(sb_entry).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print(f"Supabase journal entry error: {e}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO journal_entries (id,user_id,title,content,content_html,sentiment,
        sentiment_score,emotions,ai_summary,word_count,is_favorite,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (entry_id, user_id, entry["title"], entry["content"], entry["content_html"],
              entry["sentiment"], entry["sentiment_score"], entry["emotions"],
              entry["ai_summary"], entry["word_count"],
              1 if entry["is_favorite"] else 0, now, now))
        conn.commit()
        return entry
    except Exception as e:
        print(f"SQLite journal entry error: {e}")
        return None
    finally:
        conn.close()


async def get_journal_entries(user_id: str, search: str | None = None, sentiment: str | None = None, limit: int = 50) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            query = db.table("journal_entries").select("*").eq("user_id", user_id)
            if sentiment:
                query = query.eq("sentiment", sentiment)
            if search:
                query = query.or_(f"title.ilike.%{search}%,content.ilike.%{search}%")
            result = query.order("created_at", desc=True).limit(limit).execute()
            return result.data or []
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        sql = "SELECT * FROM journal_entries WHERE user_id=?"
        params: list = [user_id]
        if sentiment:
            sql += " AND sentiment=?"
            params.append(sentiment)
        if search:
            sql += " AND (title LIKE ? OR content LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(sql, params)
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception:
        return []
    finally:
        conn.close()


async def update_journal_entry(entry_id: str, user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    updates = {k: v for k, v in data.items() if k in (
        "title", "content", "content_html", "sentiment", "sentiment_score",
        "emotions", "ai_summary", "is_favorite"
    )}
    if "content" in updates:
        updates["word_count"] = len(updates["content"].split()) if updates["content"] else 0
    updates["updated_at"] = now

    db = get_supabase()
    if db:
        try:
            sb_updates = {**updates}
            if isinstance(sb_updates.get("emotions"), str):
                sb_updates["emotions"] = json.loads(sb_updates["emotions"])
            result = db.table("journal_entries").update(sb_updates).eq("id", entry_id).eq("user_id", user_id).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        if isinstance(updates.get("emotions"), dict):
            updates["emotions"] = json.dumps(updates["emotions"])
        set_clause = ", ".join(f"{k}=?" for k in updates)
        vals = list(updates.values()) + [entry_id, user_id]
        cursor.execute(f"UPDATE journal_entries SET {set_clause} WHERE id=? AND user_id=?", vals)
        conn.commit()
        cursor.execute("SELECT * FROM journal_entries WHERE id=?", (entry_id,))
        cols = [d[0] for d in cursor.description]
        row = cursor.fetchone()
        return dict(zip(cols, row)) if row else None
    except Exception:
        return None
    finally:
        conn.close()


async def delete_journal_entry(entry_id: str, user_id: str) -> bool:
    db = get_supabase()
    if db:
        try:
            db.table("journal_entries").delete().eq("id", entry_id).eq("user_id", user_id).execute()
            return True
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM journal_entries WHERE id=? AND user_id=?", (entry_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception:
        return False
    finally:
        conn.close()


# ── Habits CRUD ────────────────────────────────────────────────────────────────

async def get_habit_definitions(user_id: str) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            result = db.table("habit_definitions").select("*").eq("user_id", user_id).eq("is_active", True).order("sort_order").execute()
            if result.data:
                return result.data
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM habit_definitions WHERE user_id=? AND is_active=1 ORDER BY sort_order", (user_id,))
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception:
        return []
    finally:
        conn.close()


async def ensure_default_habits(user_id: str) -> list[dict]:
    """Create default habits if user has none."""
    existing = await get_habit_definitions(user_id)
    if existing:
        return existing

    now = datetime.now(timezone.utc).isoformat()
    created = []
    for i, h in enumerate(DEFAULT_HABITS):
        habit_id = str(uuid.uuid4())
        entry = {
            "id": habit_id, "user_id": user_id,
            "name": h["name"], "icon": h["icon"], "color": h["color"],
            "is_active": True, "sort_order": i, "created_at": now,
        }
        db = get_supabase()
        if db:
            try:
                result = db.table("habit_definitions").insert(entry).execute()
                if result.data:
                    created.append(result.data[0])
                    continue
            except Exception:
                pass

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        try:
            cursor.execute("""
            INSERT INTO habit_definitions (id,user_id,name,icon,color,is_active,sort_order,created_at)
            VALUES (?,?,?,?,?,1,?,?)
            """, (habit_id, user_id, h["name"], h["icon"], h["color"], i, now))
            conn.commit()
            created.append(entry)
        except Exception:
            pass
        finally:
            conn.close()

    return created


async def complete_habit(user_id: str, habit_definition_id: str, date: str, completed: bool = True) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    comp_id = str(uuid.uuid4())
    entry = {
        "id": comp_id, "user_id": user_id,
        "habit_definition_id": habit_definition_id,
        "date": date, "completed": completed, "created_at": now,
    }
    db = get_supabase()
    if db:
        try:
            if not completed:
                db.table("habit_completions").delete().eq("user_id", user_id).eq("habit_definition_id", habit_definition_id).eq("date", date).execute()
                return {"deleted": True}
            result = db.table("habit_completions").upsert(entry, on_conflict="user_id,habit_definition_id,date").execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print(f"Supabase habit completion error: {e}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        if not completed:
            cursor.execute("DELETE FROM habit_completions WHERE user_id=? AND habit_definition_id=? AND date=?",
                           (user_id, habit_definition_id, date))
            conn.commit()
            return {"deleted": True}
        cursor.execute("""
        INSERT INTO habit_completions (id,user_id,habit_definition_id,date,completed,created_at)
        VALUES (?,?,?,?,1,?)
        ON CONFLICT(user_id,habit_definition_id,date) DO UPDATE SET completed=1
        """, (comp_id, user_id, habit_definition_id, date, now))
        conn.commit()
        return entry
    except Exception:
        return None
    finally:
        conn.close()


async def get_habit_completions(user_id: str, start_date: str | None = None, end_date: str | None = None) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            query = db.table("habit_completions").select("*").eq("user_id", user_id)
            if start_date:
                query = query.gte("date", start_date)
            if end_date:
                query = query.lte("date", end_date)
            result = query.order("date", desc=True).execute()
            return result.data or []
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        sql = "SELECT * FROM habit_completions WHERE user_id=?"
        params: list = [user_id]
        if start_date:
            sql += " AND date>=?"
            params.append(start_date)
        if end_date:
            sql += " AND date<=?"
            params.append(end_date)
        sql += " ORDER BY date DESC"
        cursor.execute(sql, params)
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception:
        return []
    finally:
        conn.close()


async def get_habit_streaks(user_id: str) -> dict:
    """Calculate current and longest streaks per habit."""
    definitions = await get_habit_definitions(user_id)
    completions = await get_habit_completions(user_id)

    comp_by_habit: dict[str, set[str]] = {}
    for c in completions:
        hid = c.get("habit_definition_id", "")
        if hid not in comp_by_habit:
            comp_by_habit[hid] = set()
        comp_by_habit[hid].add(c.get("date", ""))

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    streaks: dict[str, dict] = {}

    for hdef in definitions:
        hid = hdef["id"]
        dates = sorted(comp_by_habit.get(hid, set()), reverse=True)
        current = 0
        longest = 0
        if dates:
            from datetime import timedelta
            check_date = datetime.strptime(today, "%Y-%m-%d")
            streak = 0
            for _ in range(365):
                ds = check_date.strftime("%Y-%m-%d")
                if ds in comp_by_habit.get(hid, set()):
                    streak += 1
                else:
                    if check_date.strftime("%Y-%m-%d") == today:
                        check_date -= timedelta(days=1)
                        continue
                    break
                check_date -= timedelta(days=1)
            current = streak
            temp_streak = 0
            for i, d in enumerate(dates):
                if i == 0:
                    temp_streak = 1
                else:
                    prev = datetime.strptime(dates[i - 1], "%Y-%m-%d")
                    curr = datetime.strptime(d, "%Y-%m-%d")
                    if (prev - curr).days == 1:
                        temp_streak += 1
                    else:
                        longest = max(longest, temp_streak)
                        temp_streak = 1
            longest = max(longest, temp_streak, current)

        streaks[hid] = {"current": current, "longest": longest}

    return streaks


# ── CBT Worksheets CRUD ────────────────────────────────────────────────────────

async def create_cbt_worksheet(user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    ws_id = str(uuid.uuid4())
    entry = {
        "id": ws_id, "user_id": user_id,
        "situation": data["situation"],
        "automatic_thought": data["automatic_thought"],
        "emotion": data["emotion"],
        "emotion_intensity": data.get("emotion_intensity"),
        "thinking_errors": json.dumps(data.get("thinking_errors", [])) if isinstance(data.get("thinking_errors"), list) else data.get("thinking_errors", "[]"),
        "alternative_thought": data.get("alternative_thought"),
        "action_plan": data.get("action_plan"),
        "ai_generated": data.get("ai_generated", False),
        "created_at": now,
    }
    db = get_supabase()
    if db:
        try:
            sb_entry = {**entry}
            if isinstance(sb_entry.get("thinking_errors"), str):
                sb_entry["thinking_errors"] = json.loads(sb_entry["thinking_errors"])
            result = db.table("cbt_worksheets").insert(sb_entry).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print(f"Supabase CBT worksheet error: {e}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO cbt_worksheets (id,user_id,situation,automatic_thought,emotion,
        emotion_intensity,thinking_errors,alternative_thought,action_plan,ai_generated,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (ws_id, user_id, entry["situation"], entry["automatic_thought"],
              entry["emotion"], entry["emotion_intensity"], entry["thinking_errors"],
              entry["alternative_thought"], entry["action_plan"],
              1 if entry["ai_generated"] else 0, now))
        conn.commit()
        return entry
    except Exception:
        return None
    finally:
        conn.close()


async def get_cbt_worksheets(user_id: str, limit: int = 20) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            result = db.table("cbt_worksheets").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            return result.data or []
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM cbt_worksheets WHERE user_id=? ORDER BY created_at DESC LIMIT ?", (user_id, limit))
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception:
        return []
    finally:
        conn.close()


async def delete_cbt_worksheet(ws_id: str, user_id: str) -> bool:
    db = get_supabase()
    if db:
        try:
            db.table("cbt_worksheets").delete().eq("id", ws_id).eq("user_id", user_id).execute()
            return True
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM cbt_worksheets WHERE id=? AND user_id=?", (ws_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception:
        return False
    finally:
        conn.close()


# ── Action Plans CRUD ──────────────────────────────────────────────────────────

async def create_action_plan(user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    plan_id = str(uuid.uuid4())
    entry = {
        "id": plan_id, "user_id": user_id,
        "session_id": data.get("session_id"),
        "breathing_exercise": data.get("breathing_exercise"),
        "walking_goal": data.get("walking_goal"),
        "hydration_goal": data.get("hydration_goal"),
        "meditation_rec": data.get("meditation_rec"),
        "journal_prompt": data.get("journal_prompt"),
        "sleep_rec": data.get("sleep_rec"),
        "motivational_msg": data.get("motivational_msg"),
        "created_at": now,
    }
    db = get_supabase()
    if db:
        try:
            result = db.table("action_plans").insert(entry).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO action_plans (id,user_id,session_id,breathing_exercise,walking_goal,
        hydration_goal,meditation_rec,journal_prompt,sleep_rec,motivational_msg,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (plan_id, user_id, entry["session_id"], entry["breathing_exercise"],
              entry["walking_goal"], entry["hydration_goal"], entry["meditation_rec"],
              entry["journal_prompt"], entry["sleep_rec"], entry["motivational_msg"], now))
        conn.commit()
        return entry
    except Exception:
        return None
    finally:
        conn.close()


async def get_action_plans(user_id: str, limit: int = 10) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            result = db.table("action_plans").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            return result.data or []
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM action_plans WHERE user_id=? ORDER BY created_at DESC LIMIT ?", (user_id, limit))
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception:
        return []
    finally:
        conn.close()


# ── User Profile CRUD ─────────────────────────────────────────────────────────

async def get_user_profile(user_id: str) -> dict | None:
    db = get_supabase()
    if db:
        try:
            result = db.table("user_profiles").select("*").eq("user_id", user_id).limit(1).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM user_profiles WHERE user_id=?", (user_id,))
        cols = [d[0] for d in cursor.description]
        row = cursor.fetchone()
        return dict(zip(cols, row)) if row else None
    except Exception:
        return None
    finally:
        conn.close()


async def upsert_user_profile(user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    profile_id = str(uuid.uuid4())
    entry = {
        "id": profile_id, "user_id": user_id,
        "display_name": data.get("display_name"),
        "avatar_url": data.get("avatar_url"),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "timezone": data.get("timezone", "Asia/Kolkata"),
        "goals": json.dumps(data.get("goals", [])) if isinstance(data.get("goals"), list) else data.get("goals", "[]"),
        "preferred_reminder_time": data.get("preferred_reminder_time", "09:00"),
        "wellness_goals": data.get("wellness_goals"),
        "created_at": now, "updated_at": now,
    }
    db = get_supabase()
    if db:
        try:
            sb_entry = {**entry}
            if isinstance(sb_entry.get("goals"), str):
                sb_entry["goals"] = json.loads(sb_entry["goals"])
            result = db.table("user_profiles").upsert(sb_entry, on_conflict="user_id").execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO user_profiles (id,user_id,display_name,avatar_url,age,gender,timezone,
        goals,preferred_reminder_time,wellness_goals,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET
        display_name=excluded.display_name,avatar_url=excluded.avatar_url,
        age=excluded.age,gender=excluded.gender,timezone=excluded.timezone,
        goals=excluded.goals,preferred_reminder_time=excluded.preferred_reminder_time,
        wellness_goals=excluded.wellness_goals,updated_at=excluded.updated_at
        """, (profile_id, user_id, entry["display_name"], entry["avatar_url"],
              entry["age"], entry["gender"], entry["timezone"], entry["goals"],
              entry["preferred_reminder_time"], entry["wellness_goals"], now, now))
        conn.commit()
        return entry
    except Exception:
        return None
    finally:
        conn.close()


# ── Reminders CRUD ─────────────────────────────────────────────────────────────

async def get_reminders(user_id: str) -> dict | None:
    db = get_supabase()
    if db:
        try:
            result = db.table("reminders").select("*").eq("user_id", user_id).limit(1).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM reminders WHERE user_id=?", (user_id,))
        cols = [d[0] for d in cursor.description]
        row = cursor.fetchone()
        return dict(zip(cols, row)) if row else None
    except Exception:
        return None
    finally:
        conn.close()


async def upsert_reminders(user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    rem_id = str(uuid.uuid4())
    entry = {
        "id": rem_id, "user_id": user_id,
        "journal_enabled": data.get("journal_enabled", True),
        "journal_time": data.get("journal_time", "20:00"),
        "meditation_enabled": data.get("meditation_enabled", True),
        "meditation_time": data.get("meditation_time", "07:00"),
        "water_enabled": data.get("water_enabled", True),
        "water_interval": data.get("water_interval", 60),
        "sleep_enabled": data.get("sleep_enabled", True),
        "sleep_time": data.get("sleep_time", "22:30"),
        "mood_enabled": data.get("mood_enabled", True),
        "mood_time": data.get("mood_time", "21:00"),
        "created_at": now, "updated_at": now,
    }
    db = get_supabase()
    if db:
        try:
            result = db.table("reminders").upsert(entry, on_conflict="user_id").execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO reminders (id,user_id,journal_enabled,journal_time,meditation_enabled,
        meditation_time,water_enabled,water_interval,sleep_enabled,sleep_time,
        mood_enabled,mood_time,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET
        journal_enabled=excluded.journal_enabled,journal_time=excluded.journal_time,
        meditation_enabled=excluded.meditation_enabled,meditation_time=excluded.meditation_time,
        water_enabled=excluded.water_enabled,water_interval=excluded.water_interval,
        sleep_enabled=excluded.sleep_enabled,sleep_time=excluded.sleep_time,
        mood_enabled=excluded.mood_enabled,mood_time=excluded.mood_time,updated_at=excluded.updated_at
        """, (rem_id, user_id,
              1 if entry["journal_enabled"] else 0, entry["journal_time"],
              1 if entry["meditation_enabled"] else 0, entry["meditation_time"],
              1 if entry["water_enabled"] else 0, entry["water_interval"],
              1 if entry["sleep_enabled"] else 0, entry["sleep_time"],
              1 if entry["mood_enabled"] else 0, entry["mood_time"], now, now))
        conn.commit()
        return entry
    except Exception:
        return None
    finally:
        conn.close()


# ── User Settings CRUD ─────────────────────────────────────────────────────────

async def get_user_settings(user_id: str) -> dict | None:
    db = get_supabase()
    if db:
        try:
            result = db.table("user_settings").select("*").eq("user_id", user_id).limit(1).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM user_settings WHERE user_id=?", (user_id,))
        cols = [d[0] for d in cursor.description]
        row = cursor.fetchone()
        return dict(zip(cols, row)) if row else None
    except Exception:
        return None
    finally:
        conn.close()


async def upsert_user_settings(user_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    settings_id = str(uuid.uuid4())
    entry = {
        "id": settings_id, "user_id": user_id,
        "theme": data.get("theme", "dark"),
        "notifications_enabled": data.get("notifications_enabled", True),
        "email_notifications": data.get("email_notifications", False),
        "language": data.get("language", "en"),
        "data_sharing": data.get("data_sharing", False),
        "analytics_enabled": data.get("analytics_enabled", True),
        "created_at": now, "updated_at": now,
    }
    db = get_supabase()
    if db:
        try:
            result = db.table("user_settings").upsert(entry, on_conflict="user_id").execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO user_settings (id,user_id,theme,notifications_enabled,
        email_notifications,language,data_sharing,analytics_enabled,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET
        theme=excluded.theme,notifications_enabled=excluded.notifications_enabled,
        email_notifications=excluded.email_notifications,language=excluded.language,
        data_sharing=excluded.data_sharing,analytics_enabled=excluded.analytics_enabled,
        updated_at=excluded.updated_at
        """, (settings_id, user_id, entry["theme"],
              1 if entry["notifications_enabled"] else 0,
              1 if entry["email_notifications"] else 0,
              entry["language"],
              1 if entry["data_sharing"] else 0,
              1 if entry["analytics_enabled"] else 0, now, now))
        conn.commit()
        return entry
    except Exception:
        return None
    finally:
        conn.close()


# ── Crisis Logging ────────────────────────────────────────────────────────────

async def create_crisis_log(user_id: str | None, session_id: str | None, content: str, threat_level: str = "crisis") -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    log_id = str(uuid.uuid4())
    entry = {
        "id": log_id,
        "user_id": user_id or "anonymous",
        "session_id": session_id or "",
        "content_preview": content[:100],
        "threat_level": threat_level,
        "created_at": now,
    }
    db = get_supabase()
    if db:
        try:
            db.table("notifications").insert({
                "user_id": user_id or "00000000-0000-0000-0000-000000000000",
                "type": "crisis_alert",
                "title": "Crisis Protocol Intercepted",
                "message": f"Safety monitor flagged crisis event: {content[:60]}...",
                "is_read": False,
                "created_at": now,
            }).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS crisis_logs (
            id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT,
            content_preview TEXT, threat_level TEXT, created_at TEXT
        )""")
        cursor.execute("""
        INSERT INTO crisis_logs (id, user_id, session_id, content_preview, threat_level, created_at)
        VALUES (?, ?, ?, ?, ?, ?)""", (log_id, user_id or "anonymous", session_id or "", content[:100], threat_level, now))
        conn.commit()
    except Exception as e:
        print("SQLite crisis log error:", e)
    finally:
        conn.close()
    return entry

async def export_all_user_data(user_id: str) -> dict:
    """Export all user data for download."""
    return {
        "mood_entries": await get_mood_entries(user_id),
        "journal_entries": await get_journal_entries(user_id),
        "habit_definitions": await get_habit_definitions(user_id),
        "habit_completions": await get_habit_completions(user_id),
        "cbt_worksheets": await get_cbt_worksheets(user_id),
        "action_plans": await get_action_plans(user_id),
        "profile": await get_user_profile(user_id),
        "reminders": await get_reminders(user_id),
        "settings": await get_user_settings(user_id),
    }


async def delete_all_user_data(user_id: str) -> bool:
    """Delete all user data from all tables."""
    tables = [
        "mood_entries", "journal_entries", "habit_completions",
        "habit_definitions", "cbt_worksheets", "action_plans",
        "user_profiles", "reminders", "user_settings", "notifications",
    ]
    db = get_supabase()
    if db:
        try:
            for table in tables:
                db.table(table).delete().eq("user_id", user_id).execute()
            return True
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        for table in tables:
            cursor.execute(f"DELETE FROM {table} WHERE user_id=?", (user_id,))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


# ── Persona Preferences ────────────────────────────────────────────────────────

async def set_user_persona_preference(user_id: str, persona_id: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    db = get_supabase()
    if db:
        try:
            db.table("user_persona_preferences").upsert({"user_id": user_id, "persona_id": persona_id, "updated_at": now}).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO user_persona_preferences (user_id, persona_id, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET persona_id=excluded.persona_id, updated_at=excluded.updated_at
        """, (user_id, persona_id, now))
        conn.commit()
    except Exception as e:
        print("SQLite persona pref error:", e)
    finally:
        conn.close()
    return {"user_id": user_id, "persona_id": persona_id, "updated_at": now}


async def get_user_persona_preference(user_id: str) -> str:
    db = get_supabase()
    if db:
        try:
            res = db.table("user_persona_preferences").select("persona_id").eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]["persona_id"]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT persona_id FROM user_persona_preferences WHERE user_id=?", (user_id,))
        row = cursor.fetchone()
        if row:
            return row[0]
    except Exception:
        pass
    finally:
        conn.close()
    return "cbt"


# ── PHQ-9 Assessments ───────────────────────────────────────────────────────────

async def save_phq9_assessment(user_id: str, score: int, risk_category: str, answers: list, ai_explanation: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    record_id = str(uuid.uuid4())
    answers_json = json.dumps(answers)

    db = get_supabase()
    if db:
        try:
            db.table("phq9_assessments").insert({
                "id": record_id, "user_id": user_id, "score": score,
                "risk_category": risk_category, "answers_json": answers_json,
                "ai_explanation": ai_explanation, "created_at": now
            }).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO phq9_assessments (id, user_id, score, risk_category, answers_json, ai_explanation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (record_id, user_id, score, risk_category, answers_json, ai_explanation, now))
        conn.commit()
    except Exception as e:
        print("SQLite phq9 error:", e)
    finally:
        conn.close()

    # Also add memory fact for assessment
    await upsert_user_memory(user_id, "assessment", f"PHQ-9 Depression Score: {score}/27 ({risk_category}) logged on {now[:10]}")
    await add_xp_event(user_id, "phq9_completed", 50)

    return {
        "id": record_id, "user_id": user_id, "score": score,
        "risk_category": risk_category, "answers": answers,
        "ai_explanation": ai_explanation, "created_at": now
    }


async def get_phq9_history(user_id: str) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            res = db.table("phq9_assessments").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res.data:
                return [{**item, "answers": json.loads(item["answers_json"]) if isinstance(item.get("answers_json"), str) else item.get("answers_json", [])} for item in res.data]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, user_id, score, risk_category, answers_json, ai_explanation, created_at FROM phq9_assessments WHERE user_id=? ORDER BY created_at DESC", (user_id,))
        rows = cursor.fetchall()
        return [{
            "id": r[0], "user_id": r[1], "score": r[2], "risk_category": r[3],
            "answers": json.loads(r[4]) if r[4] else [], "ai_explanation": r[5], "created_at": r[6]
        } for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


# ── GAD-7 Assessments ───────────────────────────────────────────────────────────

async def save_gad7_assessment(user_id: str, score: int, anxiety_level: str, answers: list, ai_explanation: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    record_id = str(uuid.uuid4())
    answers_json = json.dumps(answers)

    db = get_supabase()
    if db:
        try:
            db.table("gad7_assessments").insert({
                "id": record_id, "user_id": user_id, "score": score,
                "anxiety_level": anxiety_level, "answers_json": answers_json,
                "ai_explanation": ai_explanation, "created_at": now
            }).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO gad7_assessments (id, user_id, score, anxiety_level, answers_json, ai_explanation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (record_id, user_id, score, anxiety_level, answers_json, ai_explanation, now))
        conn.commit()
    except Exception as e:
        print("SQLite gad7 error:", e)
    finally:
        conn.close()

    # Also add memory fact
    await upsert_user_memory(user_id, "assessment", f"GAD-7 Anxiety Score: {score}/21 ({anxiety_level}) logged on {now[:10]}")
    await add_xp_event(user_id, "gad7_completed", 50)

    return {
        "id": record_id, "user_id": user_id, "score": score,
        "anxiety_level": anxiety_level, "answers": answers,
        "ai_explanation": ai_explanation, "created_at": now
    }


async def get_gad7_history(user_id: str) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            res = db.table("gad7_assessments").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res.data:
                return [{**item, "answers": json.loads(item["answers_json"]) if isinstance(item.get("answers_json"), str) else item.get("answers_json", [])} for item in res.data]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, user_id, score, anxiety_level, answers_json, ai_explanation, created_at FROM gad7_assessments WHERE user_id=? ORDER BY created_at DESC", (user_id,))
        rows = cursor.fetchall()
        return [{
            "id": r[0], "user_id": r[1], "score": r[2], "anxiety_level": r[3],
            "answers": json.loads(r[4]) if r[4] else [], "ai_explanation": r[5], "created_at": r[6]
        } for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


# ── AI Memories ─────────────────────────────────────────────────────────────────

async def upsert_user_memory(user_id: str, category: str, memory_text: str, weight: int = 1) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    mem_id = str(uuid.uuid4())

    db = get_supabase()
    if db:
        try:
            db.table("ai_memories").insert({
                "id": mem_id, "user_id": user_id, "category": category,
                "memory_text": memory_text, "weight": weight, "updated_at": now
            }).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO ai_memories (id, user_id, category, memory_text, weight, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (mem_id, user_id, category, memory_text, weight, now))
        conn.commit()
    except Exception as e:
        print("SQLite memory error:", e)
    finally:
        conn.close()

    return {"id": mem_id, "user_id": user_id, "category": category, "memory_text": memory_text, "weight": weight, "updated_at": now}


async def get_user_memories(user_id: str) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            res = db.table("ai_memories").select("*").eq("user_id", user_id).order("updated_at", desc=True).limit(20).execute()
            if res.data:
                return res.data
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, user_id, category, memory_text, weight, updated_at FROM ai_memories WHERE user_id=? ORDER BY updated_at DESC LIMIT 20", (user_id,))
        rows = cursor.fetchall()
        return [{
            "id": r[0], "user_id": r[1], "category": r[2],
            "memory_text": r[3], "weight": r[4], "updated_at": r[5]
        } for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


# ── Wellness Score ─────────────────────────────────────────────────────────────

async def calculate_and_save_wellness_score(user_id: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    
    # Gather user activity
    moods = await get_mood_entries(user_id)
    journals = await get_journal_entries(user_id)
    phq9 = await get_phq9_history(user_id)
    gad7 = await get_gad7_history(user_id)
    habit_completions = await get_habit_completions(user_id)

    # 1. Mood Component (0-25)
    recent_moods = moods[:7] if moods else []
    avg_mood = sum(m.get("mood_score", 5) for m in recent_moods) / len(recent_moods) if recent_moods else 6.0
    mood_subscore = min(25, round((avg_mood / 10.0) * 25))

    # 2. Sleep Component (0-20)
    sleep_entries = [m.get("sleep_hours", 7) for m in recent_moods if m.get("sleep_hours") is not None]
    avg_sleep = sum(sleep_entries) / len(sleep_entries) if sleep_entries else 7.0
    sleep_subscore = 20 if 7.0 <= avg_sleep <= 9.0 else (15 if 6.0 <= avg_sleep < 7.0 or 9.0 < avg_sleep <= 10.0 else 10)

    # 3. Stress & Anxiety Component (0-20)
    latest_gad7 = gad7[0]["score"] if gad7 else 5
    gad7_inverted = max(0, 21 - latest_gad7)
    stress_subscore = round((gad7_inverted / 21.0) * 20)

    # 4. Journal Activity (0-12)
    journal_subscore = min(12, len(journals) * 3)

    # 5. Habit Completion (0-13)
    habit_subscore = min(13, len(habit_completions) * 2)

    # 6. CBT / Meditation (0-10)
    meditation_subscore = 10 if len(journals) > 0 or len(moods) > 3 else 6

    total = mood_subscore + sleep_subscore + stress_subscore + journal_subscore + habit_subscore + meditation_subscore
    total_score = min(100, max(0, total))

    breakdown = {
        "mood": mood_subscore,
        "sleep": sleep_subscore,
        "stress": stress_subscore,
        "journal": journal_subscore,
        "habits": habit_subscore,
        "meditation": meditation_subscore,
    }

    record_id = str(uuid.uuid4())
    breakdown_json = json.dumps(breakdown)

    db = get_supabase()
    if db:
        try:
            db.table("wellness_scores").insert({
                "id": record_id, "user_id": user_id,
                "total_score": total_score, "breakdown_json": breakdown_json, "created_at": now
            }).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO wellness_scores (id, user_id, total_score, breakdown_json, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, (record_id, user_id, total_score, breakdown_json, now))
        conn.commit()
    except Exception as e:
        print("SQLite wellness error:", e)
    finally:
        conn.close()

    return {
        "id": record_id, "user_id": user_id, "total_score": total_score,
        "breakdown": breakdown, "created_at": now
    }


async def get_wellness_score_history(user_id: str) -> list[dict]:
    db = get_supabase()
    if db:
        try:
            res = db.table("wellness_scores").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(30).execute()
            if res.data:
                return [{**item, "breakdown": json.loads(item["breakdown_json"]) if isinstance(item.get("breakdown_json"), str) else item.get("breakdown_json", {})} for item in res.data]
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, user_id, total_score, breakdown_json, created_at FROM wellness_scores WHERE user_id=? ORDER BY created_at DESC LIMIT 30", (user_id,))
        rows = cursor.fetchall()
        return [{
            "id": r[0], "user_id": r[1], "total_score": r[2],
            "breakdown": json.loads(r[3]) if r[3] else {}, "created_at": r[4]
        } for r in rows]
    except Exception:
        return []
    finally:
        conn.close()


# ── Unified Timeline ────────────────────────────────────────────────────────────

async def get_unified_timeline(user_id: str, category_filter: str = "all", search_query: str = "") -> list[dict]:
    timeline_items = []

    # 1. Sessions / Chat History
    sessions = await get_user_sessions(user_id)
    for s in sessions[:10]:
        messages = await get_session_history(s["id"])
        persona = s.get("persona", "cbt")
        for m in messages:
            if search_query and search_query.lower() not in m["content"].lower():
                continue
            timeline_items.append({
                "id": m["id"],
                "type": "chat",
                "title": f"Chat ({persona.upper()}) - {m['role'].capitalize()}",
                "content": m["content"],
                "category": "chat",
                "timestamp": m.get("timestamp") or s.get("started_at"),
                "meta": {"persona": persona, "role": m["role"]}
            })

    # 2. Mood History
    moods = await get_mood_entries(user_id)
    for md in moods:
        txt = f"Mood score: {md.get('mood_score')}/10. {md.get('note', '')}"
        if search_query and search_query.lower() not in txt.lower():
            continue
        timeline_items.append({
            "id": md["id"],
            "type": "mood",
            "title": f"Mood Check-in: {md.get('mood_score')}/10",
            "content": md.get("note") or f"Logged mood score of {md.get('mood_score')}/10",
            "category": "mood",
            "timestamp": md.get("created_at"),
            "meta": {"score": md.get("mood_score"), "emotions": md.get("emotions", [])}
        })

    # 3. Journal History
    journals = await get_journal_entries(user_id)
    for j in journals:
        body = f"{j.get('title', '')} {j.get('content', '')}"
        if search_query and search_query.lower() not in body.lower():
            continue
        timeline_items.append({
            "id": j["id"],
            "type": "journal",
            "title": j.get("title") or "Journal Entry",
            "content": j.get("content", ""),
            "category": "journal",
            "timestamp": j.get("created_at"),
            "meta": {"sentiment": j.get("sentiment_score")}
        })

    # 4. PHQ-9 & GAD-7 Assessment History
    phq9 = await get_phq9_history(user_id)
    for p in phq9:
        title = f"PHQ-9 Assessment (Score: {p['score']}/27 - {p['risk_category']})"
        if search_query and search_query.lower() not in (title + " " + (p.get("ai_explanation") or "")).lower():
            continue
        timeline_items.append({
            "id": p["id"],
            "type": "assessment",
            "title": title,
            "content": p.get("ai_explanation") or f"PHQ-9 assessment submitted with score {p['score']}.",
            "category": "assessment",
            "timestamp": p.get("created_at"),
            "meta": {"score": p["score"], "category": p["risk_category"], "scale": "PHQ-9"}
        })

    gad7 = await get_gad7_history(user_id)
    for g in gad7:
        title = f"GAD-7 Assessment (Score: {g['score']}/21 - {g['anxiety_level']})"
        if search_query and search_query.lower() not in (title + " " + (g.get("ai_explanation") or "")).lower():
            continue
        timeline_items.append({
            "id": g["id"],
            "type": "assessment",
            "title": title,
            "content": g.get("ai_explanation") or f"GAD-7 assessment submitted with score {g['score']}.",
            "category": "assessment",
            "timestamp": g.get("created_at"),
            "meta": {"score": g["score"], "category": g["anxiety_level"], "scale": "GAD-7"}
        })

    # 5. CBT Worksheets
    worksheets = await get_cbt_worksheets(user_id)
    for w in worksheets:
        body = f"{w.get('trigger_event', '')} {w.get('automatic_thought', '')}"
        if search_query and search_query.lower() not in body.lower():
            continue
        timeline_items.append({
            "id": w["id"],
            "type": "cbt",
            "title": "CBT Thought Record",
            "content": f"Trigger: {w.get('trigger_event', '')} | Reframed: {w.get('rational_thought', '')}",
            "category": "cbt",
            "timestamp": w.get("created_at"),
            "meta": {"cognitive_distortion": w.get("cognitive_distortion")}
        })

    # Apply Category Filter
    if category_filter and category_filter != "all":
        timeline_items = [item for item in timeline_items if item["category"] == category_filter]

    # Sort Chronologically (newest first)
    timeline_items.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    return timeline_items


# ── XP Events & Gamification Helper ──────────────────────────────────────────────

async def add_xp_event(user_id: str, event_type: str, points: int) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    db = get_supabase()
    if db:
        try:
            db.table("user_xp_events").insert({
                "user_id": user_id, "event_type": event_type, "points": points, "created_at": now
            }).execute()
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_xp_events (
            id TEXT PRIMARY KEY, user_id TEXT, event_type TEXT, points INTEGER, created_at TEXT
        )""")
        cursor.execute("""
        INSERT INTO user_xp_events (id, user_id, event_type, points, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), user_id, event_type, points, now))
        conn.commit()
    except Exception as e:
        print("SQLite XP event error:", e)
    finally:
        conn.close()

    return {"user_id": user_id, "event_type": event_type, "points": points, "created_at": now}


async def build_user_memory_context(user_id: str | None) -> str:
    if not user_id:
        return ""

    context_parts = []
    
    # 1. Custom Memories
    memories = await get_user_memories(user_id)
    if memories:
        mem_lines = [f"- {m['category'].upper()}: {m['memory_text']}" for m in memories[:5]]
        context_parts.append("Key User Profile & Preferences:\n" + "\n".join(mem_lines))

    # 2. Recent Mood
    moods = await get_mood_entries(user_id)
    if moods:
        latest_mood = moods[0]
        context_parts.append(f"Recent Mood Check-in: Score {latest_mood.get('mood_score')}/10, Note: '{latest_mood.get('note', 'None')}'")

    # 3. Clinical Assessments
    phq9 = await get_phq9_history(user_id)
    if phq9:
        context_parts.append(f"Latest PHQ-9 Depression Assessment: {phq9[0]['score']}/27 ({phq9[0]['risk_category']})")

    gad7 = await get_gad7_history(user_id)
    if gad7:
        context_parts.append(f"Latest GAD-7 Anxiety Assessment: {gad7[0]['score']}/21 ({gad7[0]['anxiety_level']})")

    if not context_parts:
        return ""

    return "\n" + "\n".join(context_parts) + "\n"


