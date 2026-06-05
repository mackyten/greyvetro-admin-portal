from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_role
from app.auth.keycloak import get_keycloak_admin
from app.models.user import TokenUser

router = APIRouter()


@router.get("/")
async def list_users(_: TokenUser = Depends(require_role("OrgManager"))):
    kc_admin = get_keycloak_admin()
    return kc_admin.get_users()


@router.get("/me")
async def get_me(user: TokenUser = Depends(get_current_user)):
    return {"sub": user.sub, "username": user.preferred_username, "roles": user.roles}


@router.post("/")
async def create_user(payload: dict, _: TokenUser = Depends(require_role("SuperAdmin"))):
    kc_admin = get_keycloak_admin()
    user_id = kc_admin.create_user(payload)
    return {"id": user_id}


@router.delete("/{user_id}")
async def delete_user(user_id: str, _: TokenUser = Depends(require_role("SuperAdmin"))):
    kc_admin = get_keycloak_admin()
    kc_admin.delete_user(user_id)
    return {"deleted": user_id}
