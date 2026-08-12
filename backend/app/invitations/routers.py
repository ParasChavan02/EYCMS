from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.invitations.schemas import InvitationAcceptRequest, InvitationVerifyResponse
from app.invitations.services import InvitationService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/auth", tags=["Teammate Invitations"])

@router.get("/invitations/{token}", response_model=ResponseEnvelope[InvitationVerifyResponse])
def get_invitation_details(token: str, db: Session = Depends(get_db)):
    try:
        details = InvitationService.get_details(db, token)
        return make_success_response(details)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/invitations/accept", response_model=ResponseEnvelope[dict])
def accept_invitation(payload: InvitationAcceptRequest, db: Session = Depends(get_db)):
    try:
        result = InvitationService.accept_invitation(db, payload)
        return make_success_response(result)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
