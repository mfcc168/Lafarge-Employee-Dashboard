import { useEffect, useState } from "react";
import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";
import { useAuth } from "@context/AuthContext";
import { format, startOfISOWeek, endOfISOWeek, parseISO, addDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";

const Home = () => {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [authChecked, setAuthChecked] = useState(false);
  const now = new Date();
  const startDate = format(startOfISOWeek(now), 'yyyy-MM-dd');
  const endDate = format(endOfISOWeek(now), 'yyyy-MM-dd');
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(startDate);
  const [currentWeekEnd, setCurrentWeekEnd] = useState<string>(endDate);

  // Fetch entries for the current date
  const { data: dayEntries, isLoading: dailyLoading, refetch: refetchDaily } = useQuery({
    queryKey: ['report-entries', currentDate],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/all-report-entries/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { date: currentDate }
      });
      return response.data;
    },
    enabled: authChecked && !!accessToken,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch current week entries
  const { data: weekEntries, isLoading: weeklyLoading, refetch: refetchWeekly } = useQuery({
    queryKey: ['report-entries', currentWeekStart, currentWeekEnd],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/report-entries-by-date/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { start_date: currentWeekStart, end_date: currentWeekEnd }
      });
      return response.data;
    },
    enabled: authChecked && !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setAuthChecked(true);
    }
  }, [isAuthenticated, user]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    refetchDaily();
  };

  const handleWeekChange = (newDate: string) => {
    setCurrentWeekStart(newDate);
    const newEnd = format(addDays(parseISO(newDate), 6), 'yyyy-MM-dd');
    setCurrentWeekEnd(newEnd);
    refetchWeekly();
  };

  return (
    <div className="min-h-screen p-6">

        <ReportEntryList 
          allEntries={dayEntries || []} 
          currentDate={currentDate}
          onDateChange={handleDateChange}
          isLoading={dailyLoading}
        />
        <WeeklySamplesSummary entries={weekEntries || []} weekStart={currentWeekStart} onWeekChange={handleWeekChange} isLoading={weeklyLoading}/>
        <WeeklyNewClientOrder entries={weekEntries || []} weekStart={currentWeekStart} onWeekChange={handleWeekChange} isLoading={weeklyLoading}/>

    </div>
  );
};

export default Home;