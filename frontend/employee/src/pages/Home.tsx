import PageHeader from "@components/PageHeader";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Package, UserRoundPlus } from "lucide-react";
import { useId, useState } from "react";
import OverviewPeriodNavigation from "@components/OverviewPeriodNavigation";
import { formatWeekRange } from "@utils/overviewReports";
import {
  LazyReportEntryList as ReportEntryList,
  LazyWeeklyNewClientOrder as WeeklyNewClientOrder,
  LazyWeeklySamplesSummary as WeeklySamplesSummary,
} from "@components/LazyComponents";
import { useAuth } from "@context/AuthContext";
import { format, startOfISOWeek, parseISO, addDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { reportKeys } from "@utils/reportCache";
import type { ReportEntry } from "@interfaces/index";
import { backendUrl } from "@configs/DotEnv";

const Home = () => {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const now = new Date();
  const startDate = format(startOfISOWeek(now), "yyyy-MM-dd");
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(startDate);
  const currentWeekEnd = format(
    addDays(parseISO(currentWeekStart), 6),
    "yyyy-MM-dd",
  );
  const weeklyHeadingId = useId();

  // Calculate if the date is recent (within last 7 days)
  const isRecentDate = (date: string) => {
    const dateObj = parseISO(date);
    const daysDiff = Math.floor(
      (new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24),
    );
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
  const {
    data: dayEntries,
    isLoading: dailyLoading,
    isError: dailyError,
    isFetching: dailyFetching,
    refetch: refetchDay,
  } = useQuery({
    queryKey: reportKeys.day(user?.username, currentDate),
    queryFn: async ({ signal }) => {
      const response = await axios.get<ReportEntry[]>(
        `${backendUrl}/api/dashboard/report-entries/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
          timeout: 30000,
          params: { date: currentDate },
        },
      );
      return response.data;
    },
    enabled: isAuthenticated && !!accessToken && !!user?.username,
    staleTime: getDailyCacheTime(currentDate),
    gcTime: 1000 * 60 * 30, // Keep visible data during background refreshes, including today
    refetchOnWindowFocus: isRecentDate(currentDate), // Only refetch on focus for recent dates
  });

  // Fetch current week entries
  const {
    data: weekEntries,
    isLoading: weeklyLoading,
    isError: weeklyError,
    isFetching: weeklyFetching,
    refetch: refetchWeek,
  } = useQuery({
    queryKey: reportKeys.week(user?.username, currentWeekStart, currentWeekEnd),
    queryFn: async ({ signal }) => {
      const response = await axios.get<ReportEntry[]>(
        `${backendUrl}/api/dashboard/report-entries-by-date/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
          timeout: 30000,
          params: { start_date: currentWeekStart, end_date: currentWeekEnd },
        },
      );
      return response.data;
    },
    enabled: isAuthenticated && !!accessToken && !!user?.username,
    staleTime: getWeeklyCacheTime(currentWeekStart),
    gcTime: getWeeklyCacheTime(currentWeekStart) * 10, // Keep in cache 10x longer than stale time
    refetchOnWindowFocus: isRecentDate(currentWeekStart), // Only refetch on focus for recent weeks
  });

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
  };

  const handleWeekChange = (newDate: string) => {
    setCurrentWeekStart(newDate);
  };

  const visibleWeekEntries = (weekEntries || []).filter(
    (entry) =>
      user?.role !== "SALESMAN" ||
      entry.salesman_name === `${user.firstname} ${user.lastname}`,
  );
  const stats = [
    {
      label:
        currentWeekStart === startDate
          ? "Reports this week"
          : "Reports in selected week",
      value: visibleWeekEntries.length,
      note: "Recorded client visits",
      Icon: FileText,
    },
    {
      label: "Entries with orders",
      value: visibleWeekEntries.filter(
        (entry) => entry.orders || entry.tel_orders,
      ).length,
      note: "In person & by telephone",
      Icon: Package,
    },
    {
      label: "New client visits",
      value: visibleWeekEntries.filter((entry) => entry.new_client).length,
      note: "Building new connections",
      Icon: UserRoundPlus,
    },
  ];
  return (
    <div className="page-stack overview-page">
      <PageHeader
        eyebrow="YOUR WORKDAY, AT A GLANCE"
        title={`Welcome back${user?.firstname ? `, ${user.firstname}` : ""}.`}
        description="Your daily reports and weekly activity, in one place."
        actions={
          user?.role === "SALESMAN" && (
            <Link className="button button-primary" to="/report">
              Write a report
              <ArrowUpRight size={18} />
            </Link>
          )
        }
      />
      <div className="stats-grid">
        {stats.map(({ label, value, note, Icon }) => (
          <section className="surface stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className="stat-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
            </div>
            <strong className="stat-value">
              {weeklyLoading || (weeklyError && weekEntries === undefined)
                ? "—"
                : value}
            </strong>
            <p className="stat-note">{note}</p>
          </section>
        ))}
      </div>
      <ReportEntryList
        allEntries={dayEntries || []}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        isLoading={dailyLoading}
        isFetching={dailyFetching}
        isError={dailyError}
        hasData={dayEntries !== undefined}
        onRetry={() => void refetchDay()}
      />
      <section className="overview-week" aria-labelledby={weeklyHeadingId}>
        <header className="overview-week-heading">
          <div>
            <h2 id={weeklyHeadingId}>Weekly activity</h2>
            <p className="overview-caption">
              {formatWeekRange(currentWeekStart)}
            </p>
          </div>
          <OverviewPeriodNavigation
            unit="week"
            value={currentWeekStart}
            onChange={handleWeekChange}
          />
        </header>
        {weeklyError && (
          <div
            className="people-inline-message overview-refresh-error"
            role="alert"
          >
            <span>
              Weekly activity couldn’t be loaded.
              {weekEntries !== undefined && " Showing your previous results."}
            </span>
            <button
              type="button"
              className="button button-quiet"
              disabled={weeklyFetching}
              onClick={() => void refetchWeek()}
            >
              Try again
            </button>
          </div>
        )}
        <WeeklySamplesSummary
          entries={weekEntries || []}
          weekStart={currentWeekStart}
          isLoading={weeklyLoading}
          isFetching={weeklyFetching}
          isError={weeklyError && weekEntries === undefined}
          hasData={weekEntries !== undefined}
        />
        <WeeklyNewClientOrder
          entries={weekEntries || []}
          weekStart={currentWeekStart}
          isLoading={weeklyLoading}
          isFetching={weeklyFetching}
          isError={weeklyError && weekEntries === undefined}
          hasData={weekEntries !== undefined}
        />
      </section>
    </div>
  );
};
export default Home;
