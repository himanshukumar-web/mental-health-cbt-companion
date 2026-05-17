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
