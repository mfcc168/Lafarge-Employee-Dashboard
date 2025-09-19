import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { lazy } from "react";
import Layout from "@components/Layout";
import RequireAuth from "@components/RequireAuth";
import RequireRole from "@components/RequireRole";
import LoadingSpinner from "@components/LoadingSpinner";
import { useRoleBasedPreloading } from "@utils/preloader";
import { MANAGEMENT_ROLES, SALES_ROLES, PAYROLL_ROLES } from "@utils/permissions";

// Eager load critical routes
import Login from "@pages/Login";
import ChangePassword from "@pages/ChangePassword";
import Unauthorized from "@pages/Unauthorized";

// Lazy load feature routes for better performance
const Home = lazy(() => import("@pages/Home"));
const Report = lazy(() => import("@pages/Report"));
const Payroll = lazy(() => import("@pages/Payroll"));
const Vacation = lazy(() => import("@pages/Vacation"));
const Sales = lazy(() => import("@pages/Sales"));
const Client = lazy(() => import("@pages/Client"));
const Employees = lazy(() => import("@pages/Employees"));
const EmployeeDetail = lazy(() => import("@pages/EmployeeDetail"));


function App() {
  // Enable intelligent preloading based on user role
  useRoleBasedPreloading();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route 
          index 
          element={
            <RequireAuth>
              <Suspense fallback={<LoadingSpinner />}>
                <Home />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />}/>
        <Route path="/change-password" element={<ChangePassword />}/>
        <Route path="/unauthorized" element={<Unauthorized />}/>
        <Route 
          path="/client" 
          element={
            <RequireAuth>
              <Suspense fallback={<LoadingSpinner />}>
                <Client />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route 
          path="/payroll" 
          element={
            <RequireAuth>
              <RequireRole roles={PAYROLL_ROLES}>
                <Suspense fallback={<LoadingSpinner />}>
                  <Payroll />
                </Suspense>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route 
          path="/report" 
          element={
            <RequireAuth>
              <Suspense fallback={<LoadingSpinner />}>
                <Report />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route 
          path="/vacation" 
          element={
            <RequireAuth>
              <Suspense fallback={<LoadingSpinner />}>
                <Vacation />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route 
          path="/sales" 
          element={
            <RequireAuth>
              <RequireRole roles={SALES_ROLES}>
                <Suspense fallback={<LoadingSpinner />}>
                  <Sales />
                </Suspense>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route 
          path="/employees" 
          element={
            <RequireAuth>
              <RequireRole roles={MANAGEMENT_ROLES}>
                <Suspense fallback={<LoadingSpinner />}>
                  <Employees />
                </Suspense>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route 
          path="/employees/:id" 
          element={
            <RequireAuth>
              <RequireRole roles={MANAGEMENT_ROLES}>
                <Suspense fallback={<LoadingSpinner />}>
                  <EmployeeDetail />
                </Suspense>
              </RequireRole>
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
