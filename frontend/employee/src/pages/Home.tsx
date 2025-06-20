import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

const Home = () => {

  const { accessToken, user } = useAuth();

  const { data: allEntries = [], isLoading, isError } = useQuery({
    queryKey: ['allReportEntries'],
    queryFn: () =>
      axios
        .get(`${backendUrl}/api/all-report-entries/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => res.data),
    enabled: !!accessToken,
  });

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