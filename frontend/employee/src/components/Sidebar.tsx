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
  X,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useHoverPreload } from "@utils/preloader";
import {
  canViewPayroll,
  canManageEmployees,
  canAccessSales,
} from "@utils/permissions";

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const { handleMouseEnter } = useHoverPreload();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!mobileOpen) {
      if (dialog.open) dialog.close();
      return;
    }
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (media.matches) closeRef.current();
    };
    media.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = oldOverflow;
      media.removeEventListener("change", onResize);
      if (dialog.open) dialog.close();
    };
  }, [mobileOpen]);
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
  const content = (
    <>
      <NavLink
        to="/"
        className="brand"
        onClick={onClose}
        aria-label="Lafarge home"
      >
        <span className="brand-mark">
          L<span>.</span>
        </span>
        <span>
          Lafarge<small>EMPLOYEE WORKSPACE</small>
        </span>
      </NavLink>
      <p className="nav-caption">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation" className="nav-list">
        {items.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onClose}
            onMouseEnter={() => handleMouseEnter(path)}
            onFocus={() => handleMouseEnter(path)}
            className={({ isActive }) =>
              `nav-item ${isActive ? "is-active" : ""}`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
            <span className="nav-indicator" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-note">
        <span className="eyebrow">A clearer workday</span>
        <p>
          Everything you need.
          <br />
          Room to focus.
        </p>
        {user?.role === "SALESMAN" && (
          <NavLink to="/report" onClick={onClose}>
            Write a report <ArrowUpRight size={16} />
          </NavLink>
        )}
      </div>
      <div className="sidebar-account">
        <span className="avatar">
          {(user?.firstname || user?.username || "L").slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{user?.firstname || user?.username || "Lafarge"}</strong>
          <small>
            {user?.role?.toLowerCase().replace(/_/g, " ") || "Workspace"}
          </small>
        </div>
      </div>
    </>
  );
  return (
    <>
      <aside className="sidebar">{content}</aside>
      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        className="mobile-drawer"
        aria-label="Workspace navigation"
        onCancel={onClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="drawer-content">
          <button
            className="icon-button drawer-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
          {content}
        </div>
      </dialog>
    </>
  );
}
