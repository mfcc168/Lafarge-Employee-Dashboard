import { Link, useLocation } from "react-router-dom";
import { useAuth } from '@context/AuthContext';
import {
  Home,
  Wallet,
  BarChart3,
  ClipboardPaste,
  ChartNoAxesCombined
} from "lucide-react";
import { useMemo } from "react";



const navItems = [
  { label: "Home", icon: <Home size={20} />, path: "/" },
];


const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const items = useMemo(() => {
    const baseItems = [...navItems];
    if (user?.role === "SALESMAN") {
      baseItems.push({ label: "Report", icon: <BarChart3 size={20} />, path: "/report" });
    }
    if (user?.role === "DIRECTOR" || user?.role === "ADMIN") {
      baseItems.push({ label: "Payroll", icon: <Wallet size={20} />, path: "/payroll" });
    }
    if (user?.role === "DIRECTOR" || user?.role === "ADMIN") {
      baseItems.push({ label: "Sales", icon: <ChartNoAxesCombined size={20} />, path: "/sales" });
    }
    if (user?.role !== "DIRECTOR" && user?.role !== "ADMIN" && user?.role !== "CEO") {
      baseItems.push({ label: "Vacation", icon: <ClipboardPaste size={20} />, path: "/vacation" });
    }
    return baseItems;
  }, [user?.role]);
  
  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <aside className="bg-gray-900 w-60 hidden lg:flex flex-col h-screen fixed left-0 top-0 shadow-lg z-999 px-6 py-8">
        <h1 className="text-white text-2xl font-bold mb-10">Dashboard</h1>
        <ul className="space-y-6">
          {items.map(({ label, icon, path }) => (
            <li key={label}>
              <Link
                to={path}
                className={`flex items-center gap-4 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === path
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {icon}
                <span className="text-md">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden bg-gray-900 shadow-inner fixed bottom-0 w-full z-50 flex justify-around py-3">
        {items.map(({ label, icon, path }) => (
          <Link
            key={label}
            to={path}
            className={`flex flex-col items-center text-xs ${
              location.pathname === path
                ? "text-gray-300 hover:text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {icon}
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
