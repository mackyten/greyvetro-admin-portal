from fastapi import APIRouter, Depends

from app.auth.dependencies import require_role
from app.auth.keycloak import get_keycloak_admin
from app.models.user import TokenUser

router = APIRouter()


@router.get("/")
async def list_organisations(_: TokenUser = Depends(require_role("OrgManager"))):
    kc_admin = get_keycloak_admin()
    # Top-level Keycloak groups represent organisations in the tenancy model
    return kc_admin.get_groups()


@router.post("/")
async def create_organisation(payload: dict, _: TokenUser = Depends(require_role("SuperAdmin"))):
    kc_admin = get_keycloak_admin()
    group_id = kc_admin.create_group(payload)
    return {"id": group_id}


@router.delete("/{org_id}")
async def delete_organisation(org_id: str, _: TokenUser = Depends(require_role("SuperAdmin"))):
    kc_admin = get_keycloak_admin()
    kc_admin.delete_group(org_id)
    return {"deleted": org_id}
