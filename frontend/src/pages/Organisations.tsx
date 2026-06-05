import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export default function Organisations() {
  const [orgs, setOrgs] = useState<unknown[]>([]);

  useEffect(() => {
    apiClient.get('/api/organisations').then((res) => setOrgs(res.data));
  }, []);

  return (
    <div>
      <h1>Organisations</h1>
      <pre>{JSON.stringify(orgs, null, 2)}</pre>
    </div>
  );
}
