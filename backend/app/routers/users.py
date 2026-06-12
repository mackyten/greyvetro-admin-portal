from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.auth.dependencies import get_current_user, require_role
from app.auth.keycloak import get_keycloak_admin
from app.models.user import TokenUser

router = APIRouter()


class CreateUserPayload(BaseModel):
    username: str
    email: str
    firstName: str
    lastName: str
    password: str
    roles: list[str] = []
    enabled: bool = True


class UpdateUserPayload(BaseModel):
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    enabled: Optional[bool] = None


@router.get("/me")
async def get_me(user: TokenUser = Depends(get_current_user)):
    return {"sub": user.sub, "username": user.preferred_username, "email": user.email, "roles": user.roles}


@router.get("/")
async def list_users(_: TokenUser = Depends(require_role("OrgManager"))):
    return get_keycloak_admin().get_users()


@router.get("/{user_id}")
async def get_user(user_id: str, _: TokenUser = Depends(require_role("OrgManager"))):
    kc = get_keycloak_admin()
    user = kc.get_user(user_id)
    roles = [
        r["name"]
        for r in kc.get_realm_roles_of_user(user_id)
        if not r["name"].startswith("default")
    ]
    return {**user, "realmRoles": roles}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUserPayload, _: TokenUser = Depends(require_role("SuperAdmin"))):
    kc = get_keycloak_admin()
    user_id = kc.create_user({
        "username": payload.username,
        "email": payload.email,
        "firstName": payload.firstName,
        "lastName": payload.lastName,
        "enabled": payload.enabled,
        "emailVerified": True,
        "credentials": [{"type": "password", "value": payload.password, "temporary": False}],
    })
    if payload.roles:
        role_objs = [kc.get_realm_role(r) for r in payload.roles]
        kc.assign_realm_roles(user_id, role_objs)
    return {"id": user_id}


@router.put("/{user_id}")
async def update_user(user_id: str, payload: UpdateUserPayload, _: TokenUser = Depends(require_role("OrgManager"))):
    kc = get_keycloak_admin()
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    kc.update_user(user_id, update)
    return {"updated": user_id}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, _: TokenUser = Depends(require_role("SuperAdmin"))):
    get_keycloak_admin().delete_user(user_id)


@router.get("/{user_id}/roles")
async def get_user_roles(user_id: str, _: TokenUser = Depends(require_role("OrgManager"))):
    roles = get_keycloak_admin().get_realm_roles_of_user(user_id)
    return [r for r in roles if not r["name"].startswith("default")]


@router.put("/{user_id}/roles")
async def set_user_roles(
    user_id: str,
    body: dict,
    _: TokenUser = Depends(require_role("SuperAdmin")),
):
    """Replace the full set of realm roles for a user."""
    kc = get_keycloak_admin()
    new_role_names: list[str] = body.get("roles", [])

    current = [r for r in kc.get_realm_roles_of_user(user_id) if not r["name"].startswith("default")]
    if current:
        kc.delete_realm_roles_of_user(user_id, current)

    if new_role_names:
        role_objs = [kc.get_realm_role(r) for r in new_role_names]
        kc.assign_realm_roles(user_id, role_objs)

    return {"roles": new_role_names}


@router.get("/{user_id}/groups")
async def get_user_groups(user_id: str, _: TokenUser = Depends(require_role("OrgManager"))):
    return get_keycloak_admin().get_user_groups(user_id)
