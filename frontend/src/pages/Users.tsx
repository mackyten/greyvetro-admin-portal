import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export default function Users() {
  const [users, setUsers] = useState<unknown[]>([]);

  useEffect(() => {
    apiClient.get('/api/users').then((res) => setUsers(res.data));
  }, []);

  return (
    <div>
      <h1>Users</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
