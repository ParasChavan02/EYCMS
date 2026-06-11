import { Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";

function RootRedirect() {
  return <Navigate to={ROUTES.LOGIN} replace />;
}

export default RootRedirect;
