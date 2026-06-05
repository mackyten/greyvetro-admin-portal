import os
from functools import lru_cache
from keycloak import KeycloakOpenID, KeycloakAdmin


@lru_cache
def get_keycloak_openid() -> KeycloakOpenID:
    return KeycloakOpenID(
        server_url=os.environ["KEYCLOAK_URL"],
        realm_name=os.environ["KEYCLOAK_REALM"],
        client_id=os.environ["KEYCLOAK_CLIENT_ID"],
        client_secret_key=os.environ["KEYCLOAK_CLIENT_SECRET"],
    )


@lru_cache
def get_keycloak_admin() -> KeycloakAdmin:
    return KeycloakAdmin(
        server_url=os.environ["KEYCLOAK_URL"],
        realm_name=os.environ["KEYCLOAK_REALM"],
        client_id=os.environ["KEYCLOAK_CLIENT_ID"],
        client_secret_key=os.environ["KEYCLOAK_CLIENT_SECRET"],
    )
