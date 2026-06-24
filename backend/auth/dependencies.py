from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import get_supabase

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
        )
    token = credentials.credentials
    supabase = get_supabase()
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return response.user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_user_role(user=Depends(get_current_user)) -> str:
    supabase = get_supabase()
    uid = user.id
    # Check admin
    res = supabase.table("admins").select("id").eq("user_id", uid).maybe_single().execute()
    if res.data:
        return "admin"
    # Check teacher
    res = supabase.table("teachers").select("id").eq("user_id", uid).maybe_single().execute()
    if res.data:
        return "teacher"
    # Check student
    res = supabase.table("students").select("id").eq("user_id", uid).maybe_single().execute()
    if res.data:
        return "student"
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="User has no assigned role",
    )
