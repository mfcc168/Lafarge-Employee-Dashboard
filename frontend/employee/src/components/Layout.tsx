import { Outlet } from "react-router-dom";
import Sidebar from "@components/Sidebar";
import Navbar from "@components/Navbar";

const Layout = () => {
  return (
    <>
      <Sidebar />
      <Navbar/>
      <div className="flex-1 lg:ml-54 min-h-screen bg-gray-100">
        <main className="p-6 pb-16">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;
