import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusMessage from './StatusMessage.jsx';

// everything under this route needs an account. while /auth/me is still
// loading we show a holding message instead of flashing the login page
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <StatusMessage title="Checking your account">
        <p>One moment.</p>
      </StatusMessage>
    );
  }

  if (!user) {
    // so sign-in can send them back
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
