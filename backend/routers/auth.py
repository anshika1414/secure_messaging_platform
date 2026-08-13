from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from backend.database.database import get_db
from backend.schemas.auth import RegisterRequest, LoginRequest, VerifyOTPRequest, AuthTokenResponse
from backend.schemas.user import UserResponse
from backend.services.auth_service import AuthService
from backend.routers.deps import get_current_user
from backend.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: DBSession = Depends(get_db)):
    return AuthService.register_user(
        db,
        username=req.username,
        password=req.password,
        display_name=req.display_name,
        phone=req.phone
    )

@router.post("/login", response_model=AuthTokenResponse)
def login(req: LoginRequest, db: DBSession = Depends(get_db)):
    return AuthService.authenticate_user(db, login_str=req.login, password=req.password)

@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest):
    # Mock OTP verification for Signal-style login
    if req.otp_code == "123456" or len(req.otp_code) == 6:
        return {"status": "success", "message": "OTP verified successfully"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    # Delete active sessions
    db.query(User).filter(User.id == current_user.id).update({"is_online": False})
    db.commit()
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
