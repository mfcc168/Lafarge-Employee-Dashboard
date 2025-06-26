import { useEffect, useState } from "react";
import axios from "axios";
import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { Loader2 } from "lucide-react";
import { format, startOfISOWeek, endOfISOWeek, subDays } from "date-fns";

const Home = () => {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [dayEntries, setDayEntries] = useState([]);
  const [weekEntries, setWeekEntries] = useState([]);
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loadingStates, setLoadingStates] = useState({
    daily: true,
    weekly: true,
    auth: true
  });
  const [isError, setIsError] = useState({
    daily: false,
    weekly: false
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setAuthChecked(true);
      setLoadingStates(prev => ({ ...prev, auth: false }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authChecked || !accessToken) return;

    // Fetch today's entries and yesterday's entries
    const fetchDailyData = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        
        // Fetch both today and yesterday's data
        const [todayResponse, yesterdayResponse] = await Promise.all([
          axios.get(`${backendUrl}/api/all-report-entries/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              date: today
            }
          }),
          axios.get(`${backendUrl}/api/all-report-entries/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              date: yesterday
            }
          })
        ]);

        // If today has entries, use today's data
        if (todayResponse.data.length > 0) {
          setDayEntries(todayResponse.data);
          setCurrentDate(today);
        } 
        // Otherwise use yesterday's data if available
        else if (yesterdayResponse.data.length > 0) {
          setDayEntries(yesterdayResponse.data);
          setCurrentDate(yesterday);
        } 
        // If neither has data, just use empty array
        else {
          setDayEntries([]);
          setCurrentDate(today);
        }
      } catch (error) {
        console.error("Error fetching daily report entries:", error);
        setIsError(prev => ({ ...prev, daily: true }));
      } finally {
        setLoadingStates(prev => ({ ...prev, daily: false }));
      }
    };

    // Fetch weekly entries
    const fetchWeeklyData = async () => {
      try {
        const now = new Date();
        const startDate = format(startOfISOWeek(now), 'yyyy-MM-dd');
        const endDate = format(endOfISOWeek(now), 'yyyy-MM-dd');
        const weeklyResponse = await axios.get(`${backendUrl}/api/report-entries-by-date/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            start_date: startDate,
            end_date: endDate
          }
        });
        setWeekEntries(weeklyResponse.data);
      } catch (error) {
        console.error("Error fetching weekly report entries:", error);
        setIsError(prev => ({ ...prev, weekly: true }));
      } finally {
        setLoadingStates(prev => ({ ...prev, weekly: false }));
      }
    };

    // Fetch both in parallel
    Promise.all([fetchDailyData(), fetchWeeklyData()]);
  }, [accessToken, authChecked]);

  if (loadingStates.auth) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {loadingStates.daily ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : isError.daily ? (
        <div className="text-center text-red-500 py-10">Failed to load daily report entries.</div>
      ) : (
        <ReportEntryList allEntries={dayEntries}/>
      )}

      {loadingStates.weekly ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : isError.weekly ? (
        <div className="text-center text-red-500 py-10">Failed to load weekly report entries.</div>
      ) : (
        <>
          <WeeklySamplesSummary entries={weekEntries} />
          <WeeklyNewClientOrder entries={weekEntries} />
        </>
      )}
    </div>
  );
};

export default Home;