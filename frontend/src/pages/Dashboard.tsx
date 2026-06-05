import { useAuth } from '../auth/useAuth';

export default function Dashboard() {
  const { user, roles, logout } = useAuth();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.preferred_username}</p>
      <p>Roles: {roles.join(', ')}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
