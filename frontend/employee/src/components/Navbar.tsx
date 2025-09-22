import { useAuth } from "@context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, Lock, LogIn, Home, BarChart3, ClipboardPaste, ChartNoAxesCombined, CircleUser } from "lucide-react";
import { memo, useMemo, useCallback } from "react";

/**
 * Navbar Component
 * 
 * Application navigation bar with:
 * - Role-based navigation items
 * - Authentication state management
 * - Responsive design
 * - Route-aware UI elements
 * 
 * Features:
 * - Dynamic navigation items based on user role
 * - Login/logout functionality
 * - Password change option
 * - Special layout for report route
 * 
 * returns Application navigation bar
 */
const Navbar = () => {
  // Authentication and routing hooks
  const { user, logout, isAuthenticated, initialCheckComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if current route is the report page
  const isReportRoute = location.pathname === "/report";

  // Memoized navigation handlers to prevent re-renders
  const handleChangePassword = useCallback(() => navigate("/change-password"), [navigate]);
  const handleLogin = useCallback(() => navigate("/login"), [navigate]);
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  // Memoized navigation items based on authentication and role
  const navItems = useMemo(() => {
    const items = [];
    
    // Base items for authenticated users
    if (isAuthenticated) {
      items.push(
        { label: "Home", icon: <Home size={20} />, path: "/" },
        { label: "Vacation", icon: <ClipboardPaste size={20} />, path: "/vacation" }
      );
    }
    
    // Additional items for salesmen
    if (user?.role === "SALESMAN") {
      items.push(
        { label: "Report", icon: <BarChart3 size={16} />, path: "/report" },
        { label: "Client", icon: <CircleUser size={16} />, path: "/client" },
        { label: "Sales", icon: <ChartNoAxesCombined size={16} />, path: "/sales" }
      );
    }
    
    return items;
  }, [isAuthenticated, user?.role]);

  return (
    <nav className="bg-white shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Left section: Logo and conditional navigation */}
      <div className="flex items-center space-x-6">
        {/* Application logo/name */}
        <span className="text-xl font-semibold text-gray-800 tracking-wide">
          Dashboard
        </span>

        {/* Navigation links - only shown on report route */}
        {isReportRoute && (
          <div className="flex items-center space-x-4">
            {navItems.map(({ label, icon, path }) => (
              <Link
                key={label}
                to={path}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition ${
                  location.pathname === path
                    ? "bg-gray-100 text-gray-800"  // Active route styling
                    : "text-gray-600 hover:bg-gray-50"  // Inactive route styling
                }`}
              >
                {icon}
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right section: Authentication controls */}
      <div className="flex items-center space-x-3">
        {isAuthenticated || initialCheckComplete ? (
          // Authenticated user controls
          <>
            <button
              onClick={handleChangePassword}
              className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
              aria-label="Change password"
            >
              <Lock size={16} />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm px-3 py-1.5 border border-red-400 text-red-600 rounded-md hover:bg-red-50 transition"
              aria-label="Log out"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          // Guest user control
          <button
            onClick={handleLogin}
            className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
            aria-label="Log in"
          >
            <LogIn size={16} />
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default memo(Navbar);