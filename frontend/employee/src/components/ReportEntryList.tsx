import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@context/AuthContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ReportEntry } from '@interfaces/index';
import { format, addDays, parseISO } from 'date-fns';
import SkeletonRow from '@components/SkeletonRow';

interface ReportEntryListProps {
  allEntries: ReportEntry[];
  currentDate: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
}

/**
 * ReportEntryList Component
 * 
 * Displays a paginated list of sales report entries with:
 * - Date navigation controls
 * - Role-based filtering and views
 * - Salesman selection tabs
 * - Sortable entries by time
 * - Loading states and skeleton UI
 * 
 * Features:
 * - Clerk/Deliveryman can mark entries as completed
 * - Salesmen only see their own entries
 * - Managers see all entries with filtering
 */
const ReportEntryList = ({ 
  allEntries: entries, 
  currentDate, 
  onDateChange,
  isLoading 
}: ReportEntryListProps) => {
  // Authentication and user context
  const { user } = useAuth();
  const userRole = user?.role;
  const isLimitedView = userRole === 'CLERK' || userRole === 'DELIVERYMAN';
  const isSalesman = userRole === 'SALESMAN';
  const userFullname = `${user?.firstname} ${user?.lastname}`;

  // Component state
  const [selectedSalesman, setSelectedSalesman] = useState<string | null>(null);
  const [crossedRows, setCrossedRows] = useState<Set<number>>(new Set());

  /**
   * Toggles the crossed-out state for an entry (mark as completed)
   * @param {number} id - The entry ID to toggle
   */
  const toggleRowCross = (id: number) => {
    if (!isLimitedView) return;
    setCrossedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Date navigation handlers
  const handlePreviousDay = () => {
    const date = parseISO(currentDate);
    const prevDate = addDays(date, -1);
    onDateChange(format(prevDate, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const date = parseISO(currentDate);
    const nextDate = addDays(date, 1);
    if (nextDate <= new Date()) {
      onDateChange(format(nextDate, 'yyyy-MM-dd'));
    }
  };

  // Filter entries based on user role
  const filteredEntries = useMemo(() => 
    (entries || []).filter((entry: ReportEntry) =>
      isSalesman ? entry.salesman_name === userFullname : true
    ),
    [entries, isSalesman, userFullname]
  );

  // Extract unique salesmen for filtering
  const salesmen = useMemo(() => 
    Array.from(new Set(filteredEntries.map((e: ReportEntry) => e.salesman_name))).sort(),
    [filteredEntries]
  );

  // Create aliases mapping for salesmen
  const salesmenAliases = useMemo(() => {
    const aliasMap: Record<string, string> = {
      "Ho Yeung Cheung": "Alex",
      "Hung Ki So": "Dominic", 
      "Kwok Wai Mak": "Matthew",
    };
    return salesmen.reduce((acc, salesman) => {
      acc[salesman] = aliasMap[salesman] || salesman;
      return acc;
    }, {} as Record<string, string>);
  }, [salesmen]);

  // Set default salesman when list changes
  useEffect(() => {
    if (salesmen.length > 0 && (!selectedSalesman || !salesmen.includes(selectedSalesman))) {
      setSelectedSalesman(String(salesmen[0]));
    }
  }, [salesmen, selectedSalesman]);

  /**
   * Converts time range string to minutes for sorting
   * @param {string} range - Time range string (e.g. "0900-1000")
   * @returns {number} Total minutes from start of day
   */
  const startOfRangeToMinutes = (range?: string) => {
    if (!range) return 0;
    const [start] = range.split('-');
    const hours = parseInt(start.slice(0, 2), 10);
    const minutes = parseInt(start.slice(2), 10);
    return hours * 60 + minutes;
  };

  // Filter and sort entries for selected salesman
  const salesmanEntries = useMemo(() => 
    filteredEntries.filter((entry: ReportEntry) => entry.salesman_name === selectedSalesman),
    [filteredEntries, selectedSalesman]
  );

  const sortedEntries = useMemo(
    () => [...salesmanEntries].sort(
      (a, b) => startOfRangeToMinutes(a.time_range) - startOfRangeToMinutes(b.time_range)
    ),
    [salesmanEntries]
  );

  // Date comparison for navigation
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasNext = currentDate < today;

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-8 border border-gray-100 animate-scaleIn">
      {/* Header with date navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-display">Daily Reports</h2>
            <p className="text-sm text-slate-500 font-medium">{format(parseISO(currentDate), 'EEEE, MMMM dd, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousDay}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
            aria-label="Previous day"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={handleNextDay}
            disabled={!hasNext || isLoading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
            aria-label="Next day"
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Salesman selection tabs (hidden for salesmen) */}
      {!isSalesman && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Salesman tabs">
            {salesmen.map((salesman) => (
                <button
                  key={salesman as string}
                  onClick={() => setSelectedSalesman(salesman as string)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    salesman === selectedSalesman
                      ? 'border-slate-600 text-slate-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={salesman === selectedSalesman ? 'page' : undefined}
                >
                  {salesmenAliases[salesman] || salesman}
                </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main content */}
      {filteredEntries.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No daily reports available</p>
          <p className="text-slate-400 text-sm mt-1">Try selecting a different date</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Time Range</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Client Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Order Info</th>
                  {!isLimitedView && <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Product Discussion</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {isLoading ? (
                  // Loading skeleton
                  [...Array(5)].map((_, i) => (
                    <SkeletonRow key={i} columns={isLimitedView ? 3 : 4} />
                  ))
                ) : (
                  // Filtered and sorted entries
                  (isLimitedView
                    ? sortedEntries.filter((entry) => entry.orders || entry.samples || entry.tel_orders)
                    : sortedEntries
                  ).map((entry, idx) => (
                    <tr
                      key={entry.id ?? `${entry.salesman_name}-${entry.date}-${idx}`}
                      onClick={() => entry.id && toggleRowCross(Number(entry.id))}
                      className={`transition-all duration-fast hover:bg-slate-50 ${
                        isLimitedView ? 'cursor-pointer' : ''
                      } ${
                        isLimitedView && crossedRows.has(Number(entry.id)) ? 'line-through text-slate-400 bg-slate-50' : ''
                      }`}
                      aria-label={isLimitedView ? "Mark as completed" : undefined}
                    >
                      {/* Time and District */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                            {entry.district}
                          </span>
                          <span className="text-slate-600 font-medium">{entry.time_range}</span>
                        </div>
                      </td>

                      {/* Client Information */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              {entry.client_type === 'doctor' ? 'Doctor' : entry.client_type === 'nurse' ? 'Nurse' : entry.client_type}
                            </span>
                            <span className="text-slate-800 font-medium">{entry.doctor_name}</span>
                          </div>
                          {entry.new_client && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                              New Client
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Order Information */}
                      <td className="px-6 py-4">
                        <div className="space-y-3 text-sm">
                          {entry.orders && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                                Orders
                              </span>
                              <p className="text-slate-700 ml-1">{entry.orders}</p>
                            </div>
                          )}
                          {entry.tel_orders && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                                Tel Orders
                              </span>
                              <p className="text-slate-700 ml-1">{entry.tel_orders}</p>
                            </div>
                          )}
                          {entry.samples && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                                Samples
                              </span>
                              <p className="text-slate-700 ml-1">{entry.samples}</p>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Product Discussion (hidden for limited view) */}
                      {!isLimitedView && (
                        <td className="px-6 py-4">
                          <div className="space-y-3 text-sm">
                            {entry.new_product_intro && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                                  New Product Intro
                                </span>
                                <p className="text-slate-700 ml-1">{entry.new_product_intro}</p>
                              </div>
                            )}
                            {entry.old_product_followup && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                                  Follow-up
                                </span>
                                <p className="text-slate-700 ml-1">{entry.old_product_followup}</p>
                              </div>
                            )}
                            {entry.delivery_time_update && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                                  Delivery Update
                                </span>
                                <p className="text-slate-700 ml-1">{entry.delivery_time_update}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {isLoading ? (
              // Loading skeleton for mobile
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-6 bg-slate-200 rounded w-16"></div>
                      <div className="h-6 bg-slate-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-16 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              // Mobile cards
              (isLimitedView
                ? sortedEntries.filter((entry) => entry.orders || entry.samples || entry.tel_orders)
                : sortedEntries
              ).map((entry, idx) => (
                <div
                  key={entry.id ?? `${entry.salesman_name}-${entry.date}-${idx}`}
                  onClick={() => entry.id && toggleRowCross(Number(entry.id))}
                  className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 transition-all duration-200 ${
                    isLimitedView ? 'cursor-pointer hover:shadow-md' : ''
                  } ${
                    isLimitedView && crossedRows.has(Number(entry.id)) ? 'line-through text-slate-400 bg-slate-50' : ''
                  }`}
                >
                  {/* Time and Location */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                      {entry.district}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                      {entry.time_range}
                    </span>
                  </div>

                  {/* Client Information */}
                  <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        {entry.client_type === 'doctor' ? 'Doctor' : entry.client_type === 'nurse' ? 'Nurse' : entry.client_type}
                      </span>
                      <span className="text-slate-800 font-medium">{entry.doctor_name}</span>
                    </div>
                    {entry.new_client && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        New Client
                      </span>
                    )}
                  </div>

                  {/* Order Information */}
                  {(entry.orders || entry.tel_orders || entry.samples) && (
                    <div className="mb-4">
                      <div className="space-y-3 text-sm">
                        {entry.orders && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              Orders
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.orders}</p>
                          </div>
                        )}
                        {entry.tel_orders && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              Tel Orders
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.tel_orders}</p>
                          </div>
                        )}
                        {entry.samples && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              Samples
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.samples}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Product Discussion (hidden for limited view) */}
                  {!isLimitedView && (entry.new_product_intro || entry.old_product_followup || entry.delivery_time_update) && (
                    <div className="border-t border-slate-100 pt-4">
                      <div className="space-y-3 text-sm">
                        {entry.new_product_intro && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              New Product Intro
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.new_product_intro}</p>
                          </div>
                        )}
                        {entry.old_product_followup && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              Follow-up
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.old_product_followup}</p>
                          </div>
                        )}
                        {entry.delivery_time_update && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              Delivery Update
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.delivery_time_update}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportEntryList;