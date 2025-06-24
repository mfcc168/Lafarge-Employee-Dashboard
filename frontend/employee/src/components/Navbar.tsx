import { useAuth } from "@context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, Lock, LogIn, Home, BarChart3, ClipboardPaste, ChartNoAxesCombined, CircleUser } from "lucide-react"; // Added icons

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isReportRoute = location.pathname === "/report";

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigation items (same logic as Sidebar)
  const navItems = [
    { label: "Home", icon: <Home size={16} />, path: "/" },
    { label: "Vacation", icon: <ClipboardPaste size={16} />, path: "/vacation" },
  ];

  if (user?.role === "SALESMAN") {
    navItems.push({ label: "Report", icon: <BarChart3 size={16} />, path: "/report" });
    navItems.push({ label: "Client", icon: <CircleUser size={16} />, path: "/client" });
    navItems.push({ label: "Sales", icon: <ChartNoAxesCombined size={16} />, path: "/sales" });
  }

  return (
    <nav className="bg-white shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Left side: logo + navigation links (if on /report) */}
      <div className="flex items-center space-x-6">
        <span className="text-xl font-semibold text-gray-800 tracking-wide">
          Dashboard
        </span>

        {/* Show navigation links in Navbar when on /report */}
        {isReportRoute && (
          <div className="flex items-center space-x-4">
            {navItems.map(({ label, icon, path }) => (
              <Link
                key={label}
                to={path}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition ${
                  location.pathname === path
                    ? "bg-gray-100 text-gray-800"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {icon}
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right side: auth actions (unchanged) */}
      <div className="flex items-center space-x-3">
        {isAuthenticated && user ? (
          <>
            <button
              onClick={handleChangePassword}
              className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
            >
              <Lock size={16} />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm px-3 py-1.5 border border-red-400 text-red-600 rounded-md hover:bg-red-50 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
          >
            <LogIn size={16} />
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;