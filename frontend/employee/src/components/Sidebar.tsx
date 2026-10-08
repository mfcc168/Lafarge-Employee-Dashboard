import { NavLink } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import { X, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import WorkspaceNavigation from "@components/WorkspaceNavigation";

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
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
      <WorkspaceNavigation onNavigate={onClose} />
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
