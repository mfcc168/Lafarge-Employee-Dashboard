import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { lazy } from "react";
import Layout from "@components/Layout";
import RequireAuth from "@components/RequireAuth";
import LoadingSpinner from "@components/LoadingSpinner";
import { useRoleBasedPreloading } from "@utils/preloader";

// Eager load critical routes
import Login from "@pages/Login";
import ChangePassword from "@pages/ChangePassword";

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
              <Suspense fallback={<LoadingSpinner />}>
                <Payroll />
              </Suspense>
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
              <Suspense fallback={<LoadingSpinner />}>
                <Sales />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route 
          path="/employees" 
          element={
            <RequireAuth>
              <Suspense fallback={<LoadingSpinner />}>
                <Employees />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route 
          path="/employees/:id" 
          element={
            <RequireAuth>
              <Suspense fallback={<LoadingSpinner />}>
                <EmployeeDetail />
              </Suspense>
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
