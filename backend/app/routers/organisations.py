from fastapi import APIRouter, Depends, status

from app.auth.dependencies import require_role
from app.auth.keycloak import get_keycloak_admin
from app.models.user import TokenUser

router = APIRouter()


@router.get("/")
async def list_organisations(_: TokenUser = Depends(require_role("OrgManager"))):
    return get_keycloak_admin().get_groups()


@router.get("/{org_id}")
async def get_organisation(org_id: str, _: TokenUser = Depends(require_role("OrgManager"))):
    return get_keycloak_admin().get_group(org_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_organisation(payload: dict, _: TokenUser = Depends(require_role("SuperAdmin"))):
    group_id = get_keycloak_admin().create_group(payload)
    return {"id": group_id}


@router.put("/{org_id}")
async def update_organisation(org_id: str, payload: dict, _: TokenUser = Depends(require_role("SuperAdmin"))):
    get_keycloak_admin().update_group(org_id, payload)
    return {"updated": org_id}


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organisation(org_id: str, _: TokenUser = Depends(require_role("SuperAdmin"))):
    get_keycloak_admin().delete_group(org_id)


@router.get("/{org_id}/members")
async def list_members(org_id: str, _: TokenUser = Depends(require_role("OrgManager"))):
    return get_keycloak_admin().get_group_members(org_id)


@router.post("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_member(org_id: str, user_id: str, _: TokenUser = Depends(require_role("OrgManager"))):
    get_keycloak_admin().group_user_add(user_id, org_id)


@router.delete("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(org_id: str, user_id: str, _: TokenUser = Depends(require_role("OrgManager"))):
    get_keycloak_admin().group_user_remove(user_id, org_id)
