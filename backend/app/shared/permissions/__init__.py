from fastapi import HTTPException, status
from uuid import UUID

def verify_resource_ownership(
    resource_owner_id: UUID, 
    current_user_id: UUID, 
    is_admin: bool = False
) -> None:
    """
    Utility that verifies if the current_user_id matches the resource_owner_id.
    Bypassed if is_admin is True.
    """
    if not is_admin and resource_owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this resource."
        )
