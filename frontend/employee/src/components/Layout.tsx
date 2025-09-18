import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@components/Sidebar";
import Navbar from "@components/Navbar";

/**
 * Main layout component that provides the structure for the application.
 * Conditionally renders the Sidebar based on the current route,
 * always includes the Navbar, and provides a container for child routes.
 */
const Layout = () => {
  // Get current route location /?
  const location = useLocation();
  
  // Check if current route is the report page
  const isReportRoute = location.pathname === "/report";
  // Check if current route is the login page
  const isLoginRoute = location.pathname === "/login";

  return (
    <>
      {/* Conditionally render Sidebar - hidden on report and login routes */}
      {!isReportRoute && !isLoginRoute && <Sidebar />}
      
      {/* Conditionally render Navbar - hidden on login route */}
      {!isLoginRoute && <Navbar />}
      
      {/*
        Main content area with dynamic styling:
        - Adds left margin and background color except on report and login routes
        - Ensures full viewport height
        - No padding on login route to allow full-page centering
      */}
      <div className={`flex-1 ${!isReportRoute && !isLoginRoute ? "lg:ml-54 bg-gray-100" : ""} min-h-screen`}>
        <main className={isLoginRoute ? "" : "p-6 pb-16"}>
          {/* Outlet for rendering child route components */}
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;