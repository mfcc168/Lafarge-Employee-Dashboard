import { useAuth } from "@context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, LockKeyhole, Menu, ChevronRight } from "lucide-react";
import WorkspaceNavigation from "@components/WorkspaceNavigation";

const titles: Record<string, string> = {
  "/": "Overview",
  "/report": "Reports",
  "/client": "Clients",
  "/sales": "Sales",
  "/vacation": "Vacation",
  "/payroll": "Payroll",
  "/employees": "Employees",
  "/change-password": "Account settings",
  "/unauthorized": "Access restricted",
};
export default function Navbar({
  onOpenNavigation,
  navigationOpen,
  reportNavigation = false,
}: {
  onOpenNavigation: () => void;
  navigationOpen: boolean;
  reportNavigation?: boolean;
}) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <header className={`topbar ${reportNavigation ? "report-topbar" : ""}`}>
      {reportNavigation ? (
        <>
          <Link to="/" className="brand report-brand" aria-label="Lafarge home">
            <span className="brand-mark">
              L<span>.</span>
            </span>
            <span>Lafarge</span>
          </Link>
          <WorkspaceNavigation horizontal />
        </>
      ) : (
        <div className="topbar-location">
          <button
            className="icon-button mobile-menu-button"
            onClick={onOpenNavigation}
            aria-label="Open navigation"
            aria-expanded={navigationOpen}
            aria-controls="mobile-navigation"
          >
            <Menu size={21} />
          </button>
          <span className="breadcrumb-root">Workspace</span>
          <ChevronRight
            size={14}
            className="breadcrumb-root"
            aria-hidden="true"
          />
          <span>{titles[pathname] || "Employee details"}</span>
        </div>
      )}
      <div className="topbar-actions">
        <span className="topbar-date">
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        {isAuthenticated ? (
          <>
            <span className="topbar-divider" />
            <Link
              to="/change-password"
              className="icon-button"
              aria-label="Change password"
              title="Change password"
            >
              <LockKeyhole size={18} />
            </Link>
            <button
              className="icon-button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
            <span
              className="avatar avatar-small"
              aria-label={`Signed in as ${user?.username || "employee"}`}
            >
              {(user?.firstname || user?.username || "L")
                .slice(0, 1)
                .toUpperCase()}
            </span>
          </>
        ) : (
          <Link to="/login" className="button button-primary">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
