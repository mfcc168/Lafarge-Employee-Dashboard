import { useAuth } from "@context/AuthContext";
import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * RequireAuth Component
 * 
 * An authentication guard component that:
 * - Protects routes from unauthorized access
 * - Redirects unauthenticated users to login page
 * - Preserves the original location for post-login redirect
 * - Handles the initial authentication check state
 * 
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - The child components to protect
 * returns Either the protected children or a redirect to login
 */
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  // Authentication state and location
  const { accessToken, isAuthenticated, initialCheckComplete } = useAuth();
  const location = useLocation();

  // Redirect conditions:
  // 1. No access token exists
  // 2. Not authenticated AND initial auth check is complete
  if (!accessToken || (!isAuthenticated && initialCheckComplete)) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }}  // Preserve original location
        replace  // Replace current history entry
      />
    );
  }

  // Return protected children if authenticated
  return children;
};

export default RequireAuth;