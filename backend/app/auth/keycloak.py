import os
from functools import lru_cache
from keycloak import KeycloakOpenID, KeycloakAdmin


@lru_cache
def get_keycloak_openid() -> KeycloakOpenID:
    return KeycloakOpenID(
        server_url=os.environ["KEYCLOAK_URL"],
        realm_name=os.environ["KEYCLOAK_REALM"],
        client_id=os.environ["KEYCLOAK_CLIENT_ID"],
    )


@lru_cache
def get_keycloak_admin() -> KeycloakAdmin:
    # Authenticates as the Keycloak admin user (master realm) so no service
    # account or client secret is needed on the admin-portal public client.
    return KeycloakAdmin(
        server_url=os.environ["KEYCLOAK_URL"],
        username=os.environ["KEYCLOAK_ADMIN_USERNAME"],
        password=os.environ["KEYCLOAK_ADMIN_PASSWORD"],
        realm_name=os.environ["KEYCLOAK_REALM"],
        user_realm_name="master",
    )
