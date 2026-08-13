from typing import Optional
from pydantic import BaseModel

class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: str
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    login: str  # username or phone
    password: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp_code: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
