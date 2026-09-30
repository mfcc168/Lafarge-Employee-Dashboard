import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Sidebar from "@components/Sidebar";
import Navbar from "@components/Navbar";

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const isLogin = pathname === "/login";
  useEffect(() => {
    if (previousPath.current !== pathname) {
      setMobileOpen(false);
      window.scrollTo({ top: 0, behavior: "instant" });
      mainRef.current?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);
  if (isLogin)
    return (
      <main id="main-content">
        <Outlet />
      </main>
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="workspace">
        <Navbar
          onOpenNavigation={() => setMobileOpen(true)}
          navigationOpen={mobileOpen}
        />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="workspace-main"
        >
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>Lafarge · Employee workspace</span>
          <span>Made for your everyday.</span>
        </footer>
      </div>
    </div>
  );
}
