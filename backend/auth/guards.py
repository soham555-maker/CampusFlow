from fastapi import Depends, HTTPException, status
from auth.dependencies import get_current_user, get_user_role


def require_authenticated(user=Depends(get_current_user)):
    return user


def require_admin(role: str = Depends(get_user_role), user=Depends(get_current_user)):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_teacher(role: str = Depends(get_user_role), user=Depends(get_current_user)):
    if role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")
    return user


def require_student(role: str = Depends(get_user_role), user=Depends(get_current_user)):
    if role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    return user


def require_teacher_or_admin(role: str = Depends(get_user_role), user=Depends(get_current_user)):
    if role not in ("teacher", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher or Admin access required",
        )
    return user
