import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/KeycloakProvider';
import { PrivateRoute } from './auth/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Organisations from './pages/Organisations';
import Audit from './pages/Audit';
import Unauthorized from './pages/Unauthorized';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/"             element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/users"        element={<PrivateRoute requiredRole="OrgManager"><Users /></PrivateRoute>} />
          <Route path="/organisations" element={<PrivateRoute requiredRole="OrgManager"><Organisations /></PrivateRoute>} />
          <Route path="/audit"        element={<PrivateRoute requiredRole="Auditor"><Audit /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
