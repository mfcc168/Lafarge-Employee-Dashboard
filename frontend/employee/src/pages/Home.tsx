import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";
import { useAuth } from "@context/AuthContext";
import { useGetAllReportEntries } from "@hooks/useGetAllReportEntries";
import { Loader2 } from "lucide-react";

const Home = () => {

  const { user } = useAuth();

  const { data: allEntries = [], isLoading, isError } = useGetAllReportEntries();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-red-500 py-10">Failed to load report entries.</div>;
  }

  return (
    
    <div className="min-h-screen p-6">
        <ReportEntryList allEntries={allEntries} />
        {(user?.role !== "SALESMAN") && (
          <>
          <WeeklySamplesSummary entries={allEntries} />
          <WeeklyNewClientOrder entries={allEntries} />
          </>
        )}
    </div>
  );
}

export default Home;