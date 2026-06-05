import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Access Denied</h1>
      <p>You do not have the required role to view this page.</p>
      <button onClick={() => navigate('/')}>Back to Dashboard</button>
    </div>
  );
}
