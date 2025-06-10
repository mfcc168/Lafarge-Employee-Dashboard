import { useAuth } from "@context/AuthContext";
import SalesmanMonthlyReport from "@components/SalesmanMonthlyReport";
import LoadingSpinner from "@components/LoadingSpinner";
import VacationRequestList from "@components/VacationRequestList";
import ReportEntryList from "@components/ReportEntryList";

const Home = () => {
  const { user } = useAuth();
  const salesmanName = user?.username?.toLowerCase().trim() ?? "";


  return (
    <div className="min-h-screen p-6">
      {(user?.role === "MANAGER" || user?.role === "ADMIN"|| user?.role === "CEO" || user?.role === "CLERK" || user?.role === "DIRECTOR") && (
        <ReportEntryList />
      )}
      {(user?.role === "MANAGER" || user?.role === "ADMIN"|| user?.role === "CEO" || user?.role === "DIRECTOR") && (
        <VacationRequestList />
      )}
      {(user?.role === "SALESMAN") && (
      <>
          {user?.username ? (
            <SalesmanMonthlyReport
              salesmanName={salesmanName}
            />
          ) : (
            <LoadingSpinner />
          )}
      </>
      )}
    </div>
  );
}

export default Home;