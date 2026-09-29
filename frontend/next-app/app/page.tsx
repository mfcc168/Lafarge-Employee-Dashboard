"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfWeek } from "date-fns";
import { CalendarDays, PackageOpen, Sparkles, Stethoscope } from "lucide-react";
import { api } from "@/lib/api";
import type { ReportEntry } from "@/lib/types";
import { EmptyState, ErrorPanel, LoadingPanel, PageHeader, StatCard } from "@/components/ui";

function dayString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function DashboardPage() {
  const today = dayString(new Date());
  const weekStart = dayString(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = dayString(addDays(new Date(weekStart), 6));

  const daily = useQuery({
    queryKey: ["dashboard", "daily", today],
    queryFn: () =>
      api<ReportEntry[]>(`dashboard/report-entries/?date=${today}`),
  });

  const weekly = useQuery({
    queryKey: ["dashboard", "weekly", weekStart, weekEnd],
    queryFn: () =>
      api<ReportEntry[]>(
        `dashboard/report-entries-by-date/?start_date=${weekStart}&end_date=${weekEnd}`,
      ),
  });

  const dayEntries = daily.data || [];
  const weekEntries = weekly.data || [];

  const orderCount = dayEntries.filter(
    (entry) => entry.orders || entry.tel_orders,
  ).length;
  const sampleCount = dayEntries.filter((entry) => entry.samples).length;
  const newClients = weekEntries.filter((entry) => entry.new_client).length;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description="A fast overview of today's sales activity and the current week."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's visits" value={dayEntries.length} icon={Stethoscope} />
        <StatCard label="Orders today" value={orderCount} icon={PackageOpen} />
        <StatCard label="Samples today" value={sampleCount} icon={Sparkles} />
        <StatCard label="New clients this week" value={newClients} icon={CalendarDays} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Today&apos;s activity</h2>
            <p className="text-sm text-[#7a828c]">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>

        {daily.isLoading ? (
          <LoadingPanel rows={4} />
        ) : daily.error ? (
          <ErrorPanel message="Unable to load today's reports." />
        ) : dayEntries.length === 0 ? (
          <EmptyState title="No report entries today" description="New entries will appear here as the team saves them." />
        ) : (
          <div className="surface overflow-hidden">
            <div className="divide-y divide-[#edf0f2]">
              {dayEntries.slice(0, 12).map((entry, index) => (
                <div
                  key={entry.id ?? index}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[120px_1.3fr_1fr_1.5fr] sm:items-center"
                >
                  <div className="text-sm font-medium text-[#656d77]">{entry.time_range || "—"}</div>
                  <div>
                    <div className="font-medium text-[#25292e]">{entry.doctor_name || "Unnamed client"}</div>
                    <div className="text-xs text-[#8a929c]">{entry.district || "No district"}</div>
                  </div>
                  <div className="text-sm text-[#656d77]">{entry.salesman_name}</div>
                  <div className="line-clamp-2 text-sm text-[#5f6670]">
                    {entry.orders || entry.tel_orders || entry.samples || "Visit recorded"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
