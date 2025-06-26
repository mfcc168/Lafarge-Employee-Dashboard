import { useAuth } from "@context/AuthContext";
import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { accessToken, initialCheckComplete, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!accessToken || !initialCheckComplete || !isAuthenticated || !user ) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
