import { useAuth } from "@context/AuthContext";
import { useMonthlyNavigator } from "@/hooks/useMonthlyNavigator";
import SalesmanMonthlyReport from "@components/SalesmanMonthlyReport";
import LoadingSpinner from "@components/LoadingSpinner";
import MonthNavigator from "@components/MonthlyNavigator";
import VacationRequestList from "@components/VacationRequestList";
import ReportEntryList from "@components/ReportEntryList";

const Home = () => {
  const { user } = useAuth();
  const salesmanName = user?.username?.toLowerCase().trim() ?? "";

  const limitMonth = new Date(2025, 1);
  const {
    currentDate,
    navigateMonth,
    canGoPrevious,
    canGoNext,
  } = useMonthlyNavigator(limitMonth);
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
          <MonthNavigator
            year={currentDate.year}
            month={currentDate.month}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onNavigate={navigateMonth}
          />

          {user?.username ? (
            <SalesmanMonthlyReport
              salesmanName={salesmanName}
              year={currentDate.year}
              month={currentDate.month}
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