from fastapi import Depends, HTTPException
from app.core.dependencies import get_current_user

def require_role(role_name: str):
    def checker(user=Depends(get_current_user)):
        if user.role.name != role_name:
            raise HTTPException(
                status_code=403,
                detail="Permission denied"
            )
        return user
    return checker