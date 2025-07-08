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

  return (
    <>
      {/* Conditionally render Sidebar - hidden on report route */}
      {!isReportRoute && <Sidebar />}
      
      {/* Always render Navbar */}
      <Navbar />
      
      {/*
        Main content area with dynamic styling:
        - Adds left margin and background color except on report route
        - Ensures full viewport height
      */}
      <div className={`flex-1 ${!isReportRoute ? "lg:ml-54 bg-gray-100" : ""} min-h-screen`}>
        <main className="p-6 pb-16">
          {/* Outlet for rendering child route components */}
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;