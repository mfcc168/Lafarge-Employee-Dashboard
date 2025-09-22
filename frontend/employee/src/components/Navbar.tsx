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
    <nav className="bg-white backdrop-blur-md bg-opacity-90 shadow-soft border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 animate-fadeInDown">
      {/* Left section: Logo and conditional navigation */}
      <div className="flex items-center space-x-8">
        {/* Application logo/name - only show on mobile when sidebar becomes bottom nav */}
        <div className="flex items-center space-x-3 lg:hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="font-bold text-xl text-slate-800 font-display">Lafarge Dashboard</span>
        </div>

        {/* Navigation links - only shown on report route */}
        {isReportRoute && (
          <div className="flex items-center space-x-2 animate-slideInRight">
            {navItems.map(({ label, icon, path }) => (
              <Link
                key={label}
                to={path}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-all duration-fast hover:animate-buttonHover ${
                  location.pathname === path
                    ? "bg-slate-100 text-slate-700 shadow-sm"  // Active route styling
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"  // Inactive route styling
                }`}
              >
                <span className="transition-transform duration-fast hover:scale-110">{icon}</span>
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
          <div className="flex items-center space-x-3 animate-fadeInLeft">
            <button
              onClick={handleChangePassword}
              className="flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-fast hover:animate-buttonHover font-medium shadow-sm"
              aria-label="Change password"
            >
              <Lock size={16} className="transition-transform duration-fast hover:rotate-12" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm px-4 py-2 border border-error-200 bg-error-50 text-error-700 rounded-xl hover:bg-error-100 hover:border-error-300 transition-all duration-fast hover:animate-buttonHover font-medium shadow-sm"
              aria-label="Log out"
            >
              <LogOut size={16} className="transition-transform duration-fast hover:-rotate-12" />
              Logout
            </button>
          </div>
        ) : (
          // Guest user control
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 text-sm px-6 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all duration-fast hover:animate-buttonHover font-medium shadow-md hover:shadow-lg"
            aria-label="Log in"
          >
            <LogIn size={16} className="transition-transform duration-fast hover:translate-x-0.5" />
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default memo(Navbar);