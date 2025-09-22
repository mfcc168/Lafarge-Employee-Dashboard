import { useEffect, useState } from "react";
import { 
  LazyReportEntryList as ReportEntryList,
  LazyWeeklyNewClientOrder as WeeklyNewClientOrder,
  LazyWeeklySamplesSummary as WeeklySamplesSummary
} from "@components/LazyComponents";
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

  // Calculate if the date is recent (within last 7 days)
  const isRecentDate = (date: string) => {
    const dateObj = parseISO(date);
    const daysDiff = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  };

  // Dynamic cache time based on date recency
  const getDailyCacheTime = (date: string) => {
    const dateObj = parseISO(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    
    // If it's today's date, no cache
    if (dateObj.getTime() === today.getTime()) {
      return 0; // No cache for today - always fetch fresh data
    }
    
    if (isRecentDate(date)) {
      return 1000 * 30; // 30 seconds for recent data
    }
    return 1000 * 60 * 10; // 10 minutes for older data
  };

  const getWeeklyCacheTime = (weekStart: string) => {
    if (isRecentDate(weekStart)) {
      return 1000 * 60 * 2; // 2 minutes for recent weeks
    }
    return 1000 * 60 * 15; // 15 minutes for older weeks
  };

  // Fetch entries for the current date
  const { data: dayEntries, isLoading: dailyLoading, refetch: refetchDaily } = useQuery({
    queryKey: ['report-entries', currentDate],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/dashboard/report-entries/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { date: currentDate }
      });
      return response.data;
    },
    enabled: authChecked && !!accessToken,
    staleTime: getDailyCacheTime(currentDate),
    gcTime: getDailyCacheTime(currentDate) * 10, // Keep in cache 10x longer than stale time
    refetchOnWindowFocus: isRecentDate(currentDate), // Only refetch on focus for recent dates
  });

  // Fetch current week entries
  const { data: weekEntries, isLoading: weeklyLoading, refetch: refetchWeekly } = useQuery({
    queryKey: ['report-entries', currentWeekStart, currentWeekEnd],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/dashboard/report-entries-by-date/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { start_date: currentWeekStart, end_date: currentWeekEnd }
      });
      return response.data;
    },
    enabled: authChecked && !!accessToken,
    staleTime: getWeeklyCacheTime(currentWeekStart),
    gcTime: getWeeklyCacheTime(currentWeekStart) * 10, // Keep in cache 10x longer than stale time
    refetchOnWindowFocus: isRecentDate(currentWeekStart), // Only refetch on focus for recent weeks
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
    <div className="min-h-screen space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display mb-2">Welcome back!</h1>
            <p className="text-slate-100 text-lg">Here's your dashboard overview for today</p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="space-y-8">
        <div className="animate-scaleIn">
          <ReportEntryList 
            allEntries={dayEntries || []} 
            currentDate={currentDate}
            onDateChange={handleDateChange}
            isLoading={dailyLoading}
          />
        </div>
        
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-6 animate-scaleIn border border-gray-100" style={{ animationDelay: '200ms' }}>
          <WeeklySamplesSummary 
            entries={weekEntries || []} 
            weekStart={currentWeekStart} 
            onWeekChange={handleWeekChange} 
            isLoading={weeklyLoading}
          />
        </div>
        
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-6 animate-scaleIn border border-gray-100" style={{ animationDelay: '400ms' }}>
          <WeeklyNewClientOrder 
            entries={weekEntries || []} 
            weekStart={currentWeekStart} 
            onWeekChange={handleWeekChange} 
            isLoading={weeklyLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;