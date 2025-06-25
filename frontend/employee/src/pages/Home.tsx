import { useEffect, useState } from "react";
import axios from "axios";
import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { Loader2 } from "lucide-react";
import { startOfISOWeek, endOfISOWeek, format } from "date-fns";

const Home = () => {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [weekEntries, setWeekEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Only proceed if we're authenticated and have a user
    if (isAuthenticated && user) {
      setAuthChecked(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authChecked || !accessToken) return;

    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const now = new Date();
        const startDate = format(startOfISOWeek(now), 'yyyy-MM-dd');
        const endDate = format(endOfISOWeek(now), 'yyyy-MM-dd');
        
        const response = await axios.get(`${backendUrl}/api/report-entries-by-date/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            start_date: startDate,
            end_date: endDate
          }
        });
        setWeekEntries(response.data);
      } catch (error) {
        console.error("Error fetching report entries:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken, authChecked]);

  if (!authChecked) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

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
      <ReportEntryList allEntries={weekEntries} />
      <WeeklySamplesSummary entries={weekEntries} />
      <WeeklyNewClientOrder entries={weekEntries} />
    </div>
  );
};

export default Home;