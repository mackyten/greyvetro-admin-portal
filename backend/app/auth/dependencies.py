from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.keycloak import get_keycloak_openid
from app.models.user import TokenUser

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> TokenUser:
    kc = get_keycloak_openid()
    try:
        token_info = kc.introspect(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if not token_info.get("active"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inactive")

    return TokenUser.model_validate(token_info)


def require_role(role: str):
    async def _check(user: TokenUser = Depends(get_current_user)) -> TokenUser:
        if role not in user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' required",
            )
        return user
    return _check
