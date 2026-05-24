import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  // Check context user or localStorage fallback
  const isAuthenticated = user || localStorage.getItem('current_user');
  
  console.log('🛡️ ProtectedRoute check - user:', user, 'localStorage:', localStorage.getItem('current_user'), 'authenticated:', isAuthenticated)

  if (!isAuthenticated) {
    console.log('🚫 Not authenticated, redirecting to login')
    return <Navigate to="/" replace />;
  }

  console.log('✅ Authenticated, rendering protected content')
  return children;
}

export default ProtectedRoute;
