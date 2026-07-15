import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROUTES, getHomeRoute } from "../constants/routes";

function SuperAdminProtectedRoute({ children }) {
  const { user } = useAuth();
  
  const fallbackUser = (() => {
    const savedUser = localStorage.getItem("current_user");
    if (!savedUser) return null;
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

  if (role !== "SUPER_ADMIN") {
    return <Navigate to={getHomeRoute(currentUser)} replace />;
  }

  return children;
}

export default SuperAdminProtectedRoute;
