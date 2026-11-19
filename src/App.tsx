import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmpleadoDashboard from './pages/EmpleadoDashboard';

function Protected() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <div className="p-8 text-center">Cargando perfil…</div>;
  return profile.rol === 'admin' ? <AdminDashboard /> : <EmpleadoDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
