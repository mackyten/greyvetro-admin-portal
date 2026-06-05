import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from '../keycloak';

interface Props {
  children: React.ReactNode;
}

export function AuthProvider({ children }: Props) {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{ onLoad: 'login-required', pkceMethod: 'S256' }}
    >
      {children}
    </ReactKeycloakProvider>
  );
}
