import { Link, useLocation } from "react-router-dom";
import { useAuth } from '@context/AuthContext';
import {
  Home,
  Wallet,
  BarChart3,
  ClipboardPaste,
  ChartNoAxesCombined,
  CircleUser
} from "lucide-react";
import { useMemo } from "react";

/**
 * Sidebar Component
 * 
 * Provides navigation for the application with:
 * - Desktop sidebar (left side)
 * - Mobile bottom navigation
 * - Role-based menu items
 * - Active route highlighting
 */
const Sidebar = () => {

  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Generates navigation items based on user role and authentication
   * returns {Array} List of navigation items with label, icon, and path
   */
  const items = useMemo(() => {
    const baseItems = [];
    
    // Common items for all authenticated users
    if (isAuthenticated) {
      baseItems.push(
        { label: "Home", icon: <Home size={20} />, path: "/" },
        { label: "Vacation", icon: <ClipboardPaste size={20} />, path: "/vacation" }
      );
    }
    
    // Role-specific items
    if (user?.role === "SALESMAN") {
      baseItems.push({ label: "Report", icon: <BarChart3 size={20} />, path: "/report" });
    }
    if (["DIRECTOR", "ADMIN", "SALESMAN", "CEO"].includes(user?.role || "")) {
      baseItems.push({ label: "Client", icon: <CircleUser size={20} />, path: "/client" });
    }
    if (["DIRECTOR", "ADMIN"].includes(user?.role || "")) {
      baseItems.push({ label: "Payroll", icon: <Wallet size={20} />, path: "/payroll" });
    }
    if (["DIRECTOR", "ADMIN", "SALESMAN"].includes(user?.role || "")) {
      baseItems.push({ label: "Sales", icon: <ChartNoAxesCombined size={20} />, path: "/sales" });
    }
    
    return baseItems;
  }, [user?.role, isAuthenticated]);
  
  return (
    <div className="flex">
      {/* Desktop Sidebar - shown on lg screens and up */}
      <aside 
        className="bg-gray-900 w-60 hidden lg:flex flex-col h-screen fixed left-0 top-0 shadow-lg z-999 px-6 py-8"
        aria-label="Main navigation"
      >
        <h1 className="text-white text-2xl font-bold mb-10">Dashboard</h1>
        <ul className="space-y-6">
          {items.map(({ label, icon, path }) => (
            <li key={label}>
              <Link
                to={path}
                className={`flex items-center gap-4 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === path
                    ? "bg-gray-700 text-white"  // Active route styling
                    : "text-gray-400 hover:text-white hover:bg-gray-800"  // Inactive route styling
                }`}
                aria-current={location.pathname === path ? "page" : undefined}
              >
                {icon}
                <span className="text-md">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile Bottom Navigation - shown on screens smaller than lg */}
      <nav 
        className="lg:hidden bg-gray-900 shadow-inner fixed bottom-0 w-full z-50 flex justify-around py-3"
        aria-label="Mobile navigation"
      >
        {items.map(({ label, icon, path }) => (
          <Link
            key={label}
            to={path}
            className={`flex flex-col items-center text-xs ${
              location.pathname === path
                ? "text-gray-300 hover:text-white"  // Active route styling
                : "text-gray-400 hover:text-white"  // Inactive route styling
            }`}
            aria-current={location.pathname === path ? "page" : undefined}
          >
            {icon}
            <span className="mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;