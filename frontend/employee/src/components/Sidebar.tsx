import { Link, useLocation } from "react-router-dom";
import { useAuth } from '@context/AuthContext';
import {
  Home,
  Wallet,
  BarChart3,
  ClipboardPaste,
  ChartNoAxesCombined,
  CircleUser,
  Users
} from "lucide-react";
import { useMemo, memo, useCallback } from "react";
import { useHoverPreload } from '@utils/preloader';
import SidebarSkeleton from './SidebarSkeleton';
import { canViewPayroll, canManageEmployees, canAccessSales } from '@utils/permissions';

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
  const { user, isAuthenticated, initialCheckComplete } = useAuth();
  const { handleMouseEnter } = useHoverPreload();
  
  // Memoize the mouse enter handler to prevent re-renders
  const handleItemHover = useCallback((path: string) => {
    handleMouseEnter(path);
  }, [handleMouseEnter]);
  
  /**
   * Generates navigation items with progressive enhancement
   * Shows basic items immediately, adds role-specific items when loaded
   */
  const items = useMemo(() => {
    const baseItems = [];
    
    // Show basic items immediately for all authenticated users
    if (isAuthenticated) {
      baseItems.push(
        { label: "Home", icon: <Home size={20} />, path: "/" },
        { label: "Vacation", icon: <ClipboardPaste size={20} />, path: "/vacation" }
      );
      
      // Progressively add role-specific items when user data is available
      if (user?.role) {
        if (user.role === "SALESMAN") {
          baseItems.push({ label: "Report", icon: <BarChart3 size={20} />, path: "/report" });
        }
        if (canAccessSales(user.role)) {
          baseItems.push({ label: "Client", icon: <CircleUser size={20} />, path: "/client" });
        }
        if (canViewPayroll(user.role)) {
          baseItems.push({ label: "Payroll", icon: <Wallet size={20} />, path: "/payroll" });
        }
        if (canManageEmployees(user.role)) {
          baseItems.push({ label: "Employees", icon: <Users size={20} />, path: "/employees" });
        }  
        if (canAccessSales(user.role)) {
          baseItems.push({ label: "Sales", icon: <ChartNoAxesCombined size={20} />, path: "/sales" });
        }
      }
    }
    
    return baseItems;
  }, [user?.role, isAuthenticated]);
  
  // Show loading skeleton only during initial auth check
  const isInitialLoading = isAuthenticated && !initialCheckComplete && !user;
  
  // Show skeleton loader only during initial loading
  if (isInitialLoading) {
    return <SidebarSkeleton />;
  }
  
  return (
    <div className="flex">
      {/* Desktop Sidebar - shown on lg screens and up */}
      <aside 
        className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 w-64 hidden lg:flex flex-col h-screen fixed left-0 top-0 shadow-strong z-999 px-6 py-8 border-r border-gray-700 animate-slideInLeft"
        aria-label="Main navigation"
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center mb-12 animate-fadeIn">
          <h1 className="text-white text-2xl font-bold font-display tracking-tight">
            Lafarge
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1">
          <ul className="space-y-3">
            {items.map(({ label, icon, path }, index) => (
              <li key={label} className="animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
                <Link
                  to={path}
                  onMouseEnter={() => handleItemHover(path)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-normal hover:animate-buttonHover ${
                    location.pathname === path
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"  // Active route styling
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow-md"  // Inactive route styling
                  }`}
                  aria-current={location.pathname === path ? "page" : undefined}
                >
                  <span className={`transition-all duration-fast group-hover:scale-110 ${
                    location.pathname === path ? "text-white" : "text-gray-400 group-hover:text-emerald-400"
                  }`}>
                    {icon}
                  </span>
                  <span className="text-sm font-medium tracking-wide">{label}</span>
                  
                  {/* Active indicator */}
                  {location.pathname === path && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

      </aside>

      {/* Mobile Bottom Navigation - shown on screens smaller than lg */}
      <nav 
        className="lg:hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm shadow-strong border-t border-gray-700 fixed bottom-0 w-full z-50 flex justify-around py-4 animate-slideInUp"
        aria-label="Mobile navigation"
      >
        {items.map(({ label, icon, path }, index) => (
          <Link
            key={label}
            to={path}
            onMouseEnter={() => handleMouseEnter(path)}
            className={`group flex flex-col items-center text-xs transition-all duration-fast hover:animate-buttonHover ${
              location.pathname === path
                ? "text-emerald-400"  // Active route styling
                : "text-gray-400 hover:text-white"  // Inactive route styling
            }`}
            aria-current={location.pathname === path ? "page" : undefined}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`p-2 rounded-lg transition-all duration-fast group-hover:scale-110 ${
              location.pathname === path 
                ? "bg-emerald-600/20 shadow-lg" 
                : "group-hover:bg-gray-700/50"
            }`}>
              {icon}
            </div>
            <span className="mt-1 font-medium tracking-tight">{label}</span>
            
            {/* Active indicator */}
            {location.pathname === path && (
              <div className="mt-1 w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default memo(Sidebar);