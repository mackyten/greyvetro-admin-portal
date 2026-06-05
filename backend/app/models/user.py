from pydantic import BaseModel
from typing import Optional


class RealmAccess(BaseModel):
    roles: list[str] = []


class TokenUser(BaseModel):
    sub: str
    preferred_username: Optional[str] = None
    email: Optional[str] = None
    realm_access: Optional[RealmAccess] = None

    model_config = {"extra": "allow"}

    @property
    def roles(self) -> list[str]:
        return self.realm_access.roles if self.realm_access else []
