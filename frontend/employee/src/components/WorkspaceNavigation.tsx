import { NavLink } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  FilePenLine,
  CalendarDays,
  ChartNoAxesCombined,
  ContactRound,
  Users,
} from "lucide-react";
import { useHoverPreload } from "@utils/preloader";
import {
  canViewPayroll,
  canManageEmployees,
  canAccessSales,
} from "@utils/permissions";

export default function WorkspaceNavigation({
  horizontal = false,
  onNavigate,
}: {
  horizontal?: boolean;
  onNavigate?: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const { handleMouseEnter } = useHoverPreload();
  const items = isAuthenticated
    ? [
        { label: "Overview", icon: LayoutDashboard, path: "/" },
        ...(user?.role === "SALESMAN"
          ? [{ label: "Reports", icon: FilePenLine, path: "/report" }]
          : []),
        ...(canAccessSales(user?.role)
          ? [
              { label: "Clients", icon: ContactRound, path: "/client" },
              { label: "Sales", icon: ChartNoAxesCombined, path: "/sales" },
            ]
          : []),
        { label: "Vacation", icon: CalendarDays, path: "/vacation" },
        ...(canViewPayroll(user?.role)
          ? [{ label: "Payroll", icon: Wallet, path: "/payroll" }]
          : []),
        ...(canManageEmployees(user?.role)
          ? [{ label: "Employees", icon: Users, path: "/employees" }]
          : []),
      ]
    : [];
  return (
    <nav
      aria-label="Main navigation"
      className={horizontal ? "report-navigation" : "nav-list"}
    >
      {items.map(({ label, icon: Icon, path }) => (
        <NavLink
          key={path}
          to={path}
          end={path === "/"}
          onClick={onNavigate}
          onMouseEnter={() => handleMouseEnter(path)}
          onFocus={() => handleMouseEnter(path)}
          className={({ isActive }) =>
            `nav-item ${isActive ? "is-active" : ""}`
          }
        >
          <Icon size={horizontal ? 18 : 20} aria-hidden="true" />
          <span>{label}</span>
          {!horizontal && <span className="nav-indicator" aria-hidden="true" />}
        </NavLink>
      ))}
    </nav>
  );
}
