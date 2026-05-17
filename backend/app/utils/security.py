from cryptography.fernet import Fernet
import base64
import hashlib


def _get_fernet(key: str) -> Fernet:
    """Derive a valid 32-byte Fernet key from an arbitrary string."""
    raw = hashlib.sha256(key.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(raw)
    return Fernet(fernet_key)


def encrypt_message(content: str, key: str) -> str:
    """Encrypt a plaintext message string."""
    cipher = _get_fernet(key)
    return cipher.encrypt(content.encode()).decode()


def decrypt_message(encrypted: str, key: str) -> str:
    """Decrypt an encrypted message string."""
    cipher = _get_fernet(key)
    return cipher.decrypt(encrypted.encode()).decode()


def anonymize_session_id(session_id: str) -> str:
    """Return a hashed, anonymized version of a session ID for audit logs."""
    return hashlib.sha256(session_id.encode()).hexdigest()[:16]
