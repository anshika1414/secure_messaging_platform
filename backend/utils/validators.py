import re
from fastapi import HTTPException, status

def sanitize_username(username: str) -> str:
    cleaned = username.strip().lower()
    if not re.match(r"^[a-zA-Z0-9_]{3,30}$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must be 3-30 alphanumeric characters or underscores"
        )
    return cleaned

def sanitize_phone(phone: str) -> str:
    if not phone:
        return None
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    if not re.match(r"^\+?[1-9]\d{6,14}$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Phone number must be a valid E.164 format (e.g., +1234567890)"
        )
    return cleaned
