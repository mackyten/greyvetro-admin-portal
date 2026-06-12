import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.auth.dependencies import require_role
from app.auth.keycloak import get_keycloak_admin
from app.models.user import TokenUser
from app.routers import users, organisations

load_dotenv()

app = FastAPI(title="Greyvetro Admin Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(organisations.router, prefix="/api/organisations", tags=["organisations"])


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/roles")
async def list_roles(_: TokenUser = Depends(require_role("OrgManager"))):
    """All realm roles except Keycloak internals."""
    roles = get_keycloak_admin().get_realm_roles()
    return [r for r in roles if not r["name"].startswith("default") and r["name"] not in ("offline_access", "uma_authorization")]


@app.get("/api/stats")
async def stats(_: TokenUser = Depends(require_role("OrgManager"))):
    kc = get_keycloak_admin()
    all_users = kc.get_users()
    all_groups = kc.get_groups()
    roles = [r for r in kc.get_realm_roles() if not r["name"].startswith("default") and r["name"] not in ("offline_access", "uma_authorization")]

    enabled_count = sum(1 for u in all_users if u.get("enabled"))
    recent = sorted(all_users, key=lambda u: u.get("createdTimestamp", 0), reverse=True)[:5]

    return {
        "totalUsers": len(all_users),
        "enabledUsers": enabled_count,
        "totalOrgs": len(all_groups),
        "totalRoles": len(roles),
        "recentUsers": recent,
    }
