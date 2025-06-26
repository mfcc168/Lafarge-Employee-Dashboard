import { useEffect, useState } from "react";
import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";
import { useAuth } from "@context/AuthContext";
import { Loader2 } from "lucide-react";
import { format, startOfISOWeek, endOfISOWeek } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";

const Home = () => {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [authChecked, setAuthChecked] = useState(false);

  // Fetch today's entries
  const { data: dayEntries, isLoading: dailyLoading, isError: dailyError } = useQuery({
    queryKey: ['dailyEntries', currentDate],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(`${backendUrl}/api/all-report-entries/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { date: today }
      });
      
      setCurrentDate(today);
      return response.data;
    },
    enabled: authChecked && !!accessToken,
    staleTime: 0, // Always stale to force refetch on mount
  });

  // Fetch current week entries
  const { data: weekEntries, isLoading: weeklyLoading, isError: weeklyError } = useQuery({
    queryKey: ['weekEntries'],
    queryFn: async () => {
      const now = new Date();
      const startDate = format(startOfISOWeek(now), 'yyyy-MM-dd');
      const endDate = format(endOfISOWeek(now), 'yyyy-MM-dd');
      
      const response = await axios.get(`${backendUrl}/api/report-entries-by-date/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    },
    enabled: authChecked && !!accessToken,
    staleTime: 0, // Always stale to force refetch on mount
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setAuthChecked(true);
    }
  }, [isAuthenticated, user]);

  if (!authChecked) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {dailyLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : dailyError ? (
        <div className="text-center text-red-500 py-10">Failed to load daily report entries.</div>
      ) : (
        <ReportEntryList allEntries={dayEntries || []} currentDate={currentDate} />
      )}

      {weeklyLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : weeklyError ? (
        <div className="text-center text-red-500 py-10">Failed to load weekly report entries.</div>
      ) : (
        <>
          <WeeklySamplesSummary entries={weekEntries || []} />
          <WeeklyNewClientOrder entries={weekEntries || []} />
        </>
      )}
    </div>
  );
};

export default Home;