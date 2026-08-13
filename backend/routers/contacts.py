from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession
from backend.database.database import get_db
from backend.schemas.contact import ContactResponse, AddContactRequest
from backend.services.contact_service import ContactService
from backend.routers.deps import get_current_user
from backend.models import User

router = APIRouter(prefix="/contacts", tags=["Contacts"])

@router.get("", response_model=List[ContactResponse])
def get_contacts(current_user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    return ContactService.get_contacts(db, user_id=current_user.id)

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def add_contact(req: AddContactRequest, current_user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    return ContactService.add_contact(db, user_id=current_user.id, contact_user_id=req.contact_user_id)

@router.delete("/{contact_user_id}")
def remove_contact(contact_user_id: str, current_user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    ContactService.remove_contact(db, user_id=current_user.id, contact_user_id=contact_user_id)
    return {"message": "Contact removed"}
