import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROUTES, getHomeRoute } from "../constants/routes";

function RootRedirect() {
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

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Navigate to={getHomeRoute(currentUser)} replace />;
}

export default RootRedirect;
