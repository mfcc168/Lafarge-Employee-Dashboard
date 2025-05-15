import { useAuth } from "@context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Lock, LogIn } from "lucide-react"; // optional icons

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-white shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Left side: logo/title */}
      <div className="text-xl font-semibold text-gray-800 tracking-wide">
        Dashboard
      </div>

      {/* Right side: auth actions */}
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
