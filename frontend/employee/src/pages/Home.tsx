import { useEffect, useState } from "react";
import axios from "axios";
import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { Loader2 } from "lucide-react";

const Home = () => {
  const { accessToken } = useAuth();
  const [allEntries, setAllEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await axios.get(`${backendUrl}/api/all-report-entries/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setAllEntries(response.data);
      } catch (error) {
        console.error("Error fetching report entries:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

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
      <WeeklySamplesSummary entries={allEntries} />
      <WeeklyNewClientOrder entries={allEntries} />
    </div>
  );
};

export default Home;
