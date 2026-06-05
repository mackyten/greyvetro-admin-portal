import { useKeycloak } from '@react-keycloak/web';

export function useAuth() {
  const { keycloak, initialized } = useKeycloak();

  return {
    initialized,
    isAuthenticated: keycloak.authenticated ?? false,
    token: keycloak.token,
    user: keycloak.tokenParsed,
    roles: (keycloak.tokenParsed?.realm_access?.roles ?? []) as string[],
    hasRole: (role: string) => keycloak.hasRealmRole(role),
    logout: () => keycloak.logout(),
  };
}
