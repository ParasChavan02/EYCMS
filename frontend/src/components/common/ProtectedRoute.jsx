import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const isAuthenticated = user || localStorage.getItem("current_user");

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
}

export default ProtectedRoute;
