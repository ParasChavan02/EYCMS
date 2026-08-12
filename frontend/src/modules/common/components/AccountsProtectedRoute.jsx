import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../constants/routes";

function AccountsProtectedRoute({ children }) {
  const { user } = useAuth();

  const fallbackUser = (() => {
    const savedUser = localStorage.getItem("current_user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  })();

  const currentUser = user || fallbackUser;
  const role = currentUser?.role?.toUpperCase();

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (role !== "ACCOUNTS") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AccountsProtectedRoute;