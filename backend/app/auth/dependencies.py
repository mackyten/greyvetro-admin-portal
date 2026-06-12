from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.keycloak import get_keycloak_openid
from app.models.user import TokenUser

bearer_scheme = HTTPBearer()


def _public_key(kc) -> str:
    raw = kc.public_key()
    return f"-----BEGIN PUBLIC KEY-----\n{raw}\n-----END PUBLIC KEY-----"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> TokenUser:
    kc = get_keycloak_openid()
    try:
        claims = kc.decode_token(
            credentials.credentials,
            key=_public_key(kc),
            options={"verify_exp": True, "verify_aud": False},
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    return TokenUser.model_validate(claims)


def require_role(role: str):
    async def _check(user: TokenUser = Depends(get_current_user)) -> TokenUser:
        # SuperAdmin bypasses all role checks
        if "SuperAdmin" not in user.roles and role not in user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' required",
            )
        return user
    return _check
