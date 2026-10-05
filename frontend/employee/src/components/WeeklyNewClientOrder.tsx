import TableRegion from "@components/TableRegion";
import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfISOWeek,
  endOfISOWeek,
  addDays,
  parseISO,
} from "date-fns";
import { useAuth } from "@context/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ReportEntry } from "@interfaces/ReportEntryType";
import LoadingSpinner from "@components/LoadingSpinner";
import TableLoadingRow from "@components/TableLoadingRow";

interface WeeklyNewClientOrderProps {
  entries: ReportEntry[];
  weekStart: string;
  onWeekChange: (newStartDate: string) => void;
  isLoading: boolean;
}

/**
 * WeeklyNewClientOrder Component
 *
 * Displays a weekly report of new client orders with:
 * - Week navigation controls
 * - Salesman filtering (for non-salesman users)
 * - Focuses specifically on new client orders
 * - Date range display
 */
const WeeklyNewClientOrder = ({
  entries,
  weekStart,
  onWeekChange,
  isLoading,
}: WeeklyNewClientOrderProps) => {
  // Authentication and user context
  const { user } = useAuth();
  const userRole = user?.role;
  const isSalesman = userRole === "SALESMAN";
  const userFullname = `${user?.firstname} ${user?.lastname}`;

  // Component state
  const [selectedSalesman, setSelectedSalesman] = useState<string | null>(null);

  // Filter entries to only show new clients
  const newClientEntries = useMemo(
    () => (entries || []).filter((e: ReportEntry) => e.new_client === true),
    [entries],
  );

  // Week navigation handlers
  const handlePreviousWeek = () => {
    const newStart = format(addDays(parseISO(weekStart), -7), "yyyy-MM-dd");
    onWeekChange(newStart);
  };

  const handleNextWeek = () => {
    const newStart = format(addDays(parseISO(weekStart), 7), "yyyy-MM-dd");
    if (parseISO(newStart) <= new Date()) {
      onWeekChange(newStart);
    }
  };

  // Extract unique salesmen from entries
  const salesmen = useMemo(
    () =>
      Array.from(
        new Set(newClientEntries.map((e: ReportEntry) => e.salesman_name)),
      ).sort(),
    [newClientEntries],
  );

  // Create aliases mapping for salesmen
  const salesmenAliases = useMemo(() => {
    const aliasMap: Record<string, string> = {
      "Ho Yeung Cheung": "Alex",
      "Hung Ki So": "Dominic",
      "Kwok Wai Mak": "Matthew",
    };
    return salesmen.reduce(
      (acc, salesman) => {
        acc[salesman] = aliasMap[salesman] || salesman;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [salesmen]);

  // Set default salesman selection
  useEffect(() => {
    if (!selectedSalesman && salesmen.length) {
      setSelectedSalesman(isSalesman ? userFullname : (salesmen[0] as string));
    }
  }, [salesmen, selectedSalesman, isSalesman, userFullname]);

  // Format week range for display
  const weekRange = `${format(parseISO(weekStart), "MMM dd")} - ${format(endOfISOWeek(parseISO(weekStart)), "MMM dd, yyyy")}`;

  // Filter entries by selected salesman
  const filteredEntries = newClientEntries.filter(
    (e: ReportEntry) => e.salesman_name === selectedSalesman,
  );

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="section-icon">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 font-display">
              Weekly New Client Orders
            </h2>
            <p className="text-sm text-gray-600 font-medium">{weekRange}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousWeek}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
            aria-label="Previous week"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={handleNextWeek}
            disabled={
              isLoading || parseISO(weekStart) >= startOfISOWeek(new Date())
            }
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
            aria-label="Next week"
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Salesman selection tabs (hidden for salesmen) */}
      {!isSalesman && salesmen.length > 0 && (
        <div className="mb-6 min-w-0">
          <nav className="segmented-control" aria-label="Salesman tabs">
            {salesmen.map((salesman) => (
              <button
                key={salesman as string}
                onClick={() => setSelectedSalesman(salesman as string)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  salesman === selectedSalesman
                    ? "border-gray-600 text-gray-600"
                    : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                }`}
                aria-pressed={salesman === selectedSalesman}
              >
                {salesmenAliases[salesman] || salesman}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Content Area */}
      {filteredEntries.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">
            {selectedSalesman
              ? `${isSalesman ? "You have" : "This salesman has"} no new client orders this week`
              : "No new client orders for this week"}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Try selecting a different week or salesman
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <TableRegion label="Weekly new client orders">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className=" bg-gray-800 ">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Time Range
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Client Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Order Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading
                    ? (
                        <TableLoadingRow
                          columns={4}
                          message="Loading new client orders…"
                        />
                      )
                    : // Data rows
                      filteredEntries.map((e: ReportEntry) => (
                        <tr
                          key={e.id}
                          className="hover:bg-gray-50 transition-colors duration-fast"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                              {format(parseISO(e.date), "MMM dd")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                                {e.district}
                              </span>
                              <span className="text-gray-600 font-medium">
                                {e.time_range}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                                  {e.client_type === "doctor"
                                    ? "Doctor"
                                    : e.client_type === "nurse"
                                      ? "Nurse"
                                      : e.client_type}
                                </span>
                                <span className="text-gray-800 font-medium">
                                  {e.doctor_name}
                                </span>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                New Client
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-3 text-sm">
                              {e.orders && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                                    Orders
                                  </span>
                                  <p className="text-gray-700 ml-1">
                                    {e.orders}
                                  </p>
                                </div>
                              )}
                              {e.tel_orders && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                                    Tel Orders
                                  </span>
                                  <p className="text-gray-700 ml-1">
                                    {e.tel_orders}
                                  </p>
                                </div>
                              )}
                              {e.samples && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                                    Samples
                                  </span>
                                  <p className="text-gray-700 ml-1">
                                    {e.samples}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </TableRegion>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {isLoading
              ? <LoadingSpinner message="Loading new client orders…" />
              : // Mobile cards
                filteredEntries.map((e: ReportEntry) => (
                  <div
                    key={e.id}
                    className="surface rounded-xl border shadow-sm p-4 transition-colors duration-200"
                  >
                    {/* Date, Time and Location */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                        {format(parseISO(e.date), "MMM dd")}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                        {e.district}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                        {e.time_range}
                      </span>
                    </div>

                    {/* Client Information */}
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                          {e.client_type === "doctor"
                            ? "Doctor"
                            : e.client_type === "nurse"
                              ? "Nurse"
                              : e.client_type}
                        </span>
                        <span className="text-gray-800 font-medium">
                          {e.doctor_name}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        New Client
                      </span>
                    </div>

                    {/* Order Details */}
                    {(e.orders || e.tel_orders || e.samples) && (
                      <div className="space-y-3 text-sm">
                        {e.orders && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                              Orders
                            </span>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {e.orders}
                            </p>
                          </div>
                        )}
                        {e.tel_orders && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                              Tel Orders
                            </span>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {e.tel_orders}
                            </p>
                          </div>
                        )}
                        {e.samples && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                              Samples
                            </span>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {e.samples}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklyNewClientOrder;
