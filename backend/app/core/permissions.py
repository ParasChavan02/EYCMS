from typing import List
from fastapi import HTTPException, status
from app.common.models.user import User

class RoleChecker:
    """
    Checks if the authenticated user's role is within the allowed roles list.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User) -> User:
        if not current_user.role or current_user.role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not have permissions to access this resource.",
            )
        return current_user

class PermissionChecker:
    """
    Checks for specific permission keys if required by future resource checks.
    """
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, current_user: User) -> User:
        # Placeholder for dynamic/fine-grained permission validation
        return current_user
