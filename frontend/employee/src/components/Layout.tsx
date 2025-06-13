import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@components/Sidebar";
import Navbar from "@components/Navbar";

const Layout = () => {
  const location = useLocation();
  const isReportRoute = location.pathname === "/report";

  return (
    <>
      {!isReportRoute && <Sidebar />}
      <Navbar />
      <div className={`flex-1 ${!isReportRoute ? "lg:ml-54 bg-gray-100" : ""} min-h-screen `}>
        <main className="p-6 pb-16">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;