from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession
from backend.database.database import get_db
from backend.schemas.group import GroupResponse, CreateGroupRequest, AddGroupMemberRequest
from backend.services.group_service import GroupService
from backend.routers.deps import get_current_user
from backend.models import User

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_group(
    req: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    group = GroupService.create_group(
        db, creator_id=current_user.id, name=req.name, member_ids=req.member_ids
    )
    return {"status": "success", "group_id": group.id, "conversation_id": group.conversation_id}

@router.post("/{group_id}/members")
def add_group_member(
    group_id: str,
    req: AddGroupMemberRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    GroupService.add_member(
        db, group_id=group_id, current_user_id=current_user.id, target_user_id=req.user_id, role=req.role
    )
    return {"message": "Member added successfully"}

@router.delete("/{group_id}/members/{user_id}")
def remove_group_member(
    group_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    GroupService.remove_member(
        db, group_id=group_id, current_user_id=current_user.id, target_user_id=user_id
    )
    return {"message": "Member removed successfully"}
