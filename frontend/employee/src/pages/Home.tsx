import { useAuth } from "@context/AuthContext";
import SalesmanMonthlyReport from "@components/SalesmanMonthlyReport";
import LoadingSpinner from "@components/LoadingSpinner";
import VacationRequestList from "@components/VacationRequestList";
import ReportEntryList from "@components/ReportEntryList";

const Home = () => {
  const { user } = useAuth();
  const salesmanName = user?.username?.toLowerCase().trim() ?? "";

  const isManagerialRole = ["MANAGER", "ADMIN", "CEO", "DIRECTOR"].includes(user?.role || "");


  return (
    <div className="min-h-screen p-6">
      {isManagerialRole && (
        <>
        <ReportEntryList />
        <VacationRequestList />
        </>
      )}
      
      {(user?.role === "SALESMAN") && (
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
          {user?.username ? (
            <SalesmanMonthlyReport
              salesmanName={salesmanName}
            />
          ) : (
            <LoadingSpinner />
          )}
      </div>
      )}
    </div>
  );
}

export default Home;