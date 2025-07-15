from typing import List
from fastapi import HTTPException, status, Depends
from functools import wraps
from .auth import get_current_active_user, User

# Role definitions
ROLES = {
    "admin": ["read", "write", "delete", "generate_report", "manage_users"],
    "fraud_analyst": ["read", "write", "generate_report"],
    "viewer": ["read"]
}

def check_permissions(required_permissions: List[str]):
    """Decorator to check if user has required permissions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check permissions
            user_permissions = set()
            for role in current_user.roles:
                user_permissions.update(ROLES.get(role, []))
            
            if not all(perm in user_permissions for perm in required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)):
        if not any(role in self.allowed_roles for role in current_user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user