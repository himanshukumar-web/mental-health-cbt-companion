from supabase import create_client, Client
from app.config import settings

_client: Client | None = None


def get_supabase() -> Client | None:
    """Return the Supabase client, or None if not configured."""
    global _client
    if _client is not None:
        return _client
    if settings.supabase_url and settings.supabase_service_key:
        try:
            _client = create_client(settings.supabase_url, settings.supabase_service_key)
        except Exception:
            _client = None
    return _client
