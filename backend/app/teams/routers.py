from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, verify_user
from app.common.models.user import User
from app.teams.schemas import TeamSetupRequest, TeammateInvite
from app.teams.services import TeamService
from app.auth.schemas import UserResponse
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(tags=["Team Operations"])

@router.post("/user/setup-team", response_model=ResponseEnvelope[UserResponse])
def setup_team(
    payload: TeamSetupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_user)
):
    try:
        updated_user = TeamService.setup_team(db, current_user, payload)
        response_user = UserResponse(
            id=str(updated_user.id),
            name=updated_user.name,
            email=updated_user.email,
            role=updated_user.role.name if updated_user.role else "USER",
            projectId=updated_user.project.project_id if updated_user.project else None,
            teamConfigured=updated_user.team_configured
        )
        return make_success_response(response_user)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/user/invite-teammate", response_model=ResponseEnvelope[dict])
def invite_teammate(
    payload: TeammateInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_user)
):
    try:
        result = TeamService.invite_teammate(db, current_user, payload)
        return make_success_response(result)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
