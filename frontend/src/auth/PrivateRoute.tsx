import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
}

export function PrivateRoute({ children, requiredRole }: Props) {
  const { initialized, isAuthenticated, hasRole } = useAuth();

  if (!initialized) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/unauthorized" replace />;
  if (requiredRole && !hasRole(requiredRole)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
