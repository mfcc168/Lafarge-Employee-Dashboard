import { useAuth } from "@context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { hasRole, UserRole } from "@utils/permissions";
import { JSX } from "react";

/**
 * RequireRole Component
 * 
 * A role-based access control component that:
 * - Protects routes from unauthorized access based on roles
 * - Redirects unauthorized users to an appropriate page
 * - Works in conjunction with RequireAuth for complete protection
 * 
 * @param {Object} props - Component props
 * @param {UserRole[]} props.roles - Array of allowed roles
 * @param {JSX.Element} props.children - The child components to protect
 * @param {string} [props.redirectTo] - Custom redirect path (default: "/unauthorized")
 * @returns Either the protected children or a redirect
 */
interface RequireRoleProps {
  roles: UserRole[];
  children: JSX.Element;
  redirectTo?: string;
}

const RequireRole = ({ roles, children, redirectTo = "/unauthorized" }: RequireRoleProps) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // If not authenticated, let RequireAuth handle it
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!user || !hasRole(user.role, roles)) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: `You need one of these roles to access this page: ${roles.join(', ')}`
        }}
        replace
      />
    );
  }

  // User has required role, render protected content
  return children;
};

export default RequireRole;