import { useState, useEffect, useMemo } from 'react';
import { format, startOfISOWeek, endOfISOWeek, addDays, parseISO } from 'date-fns';
import { useAuth } from '@context/AuthContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ReportEntry } from '@interfaces/ReportEntryType';
import SkeletonRow from '@components/SkeletonRow';

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
  isLoading 
}: WeeklyNewClientOrderProps) => {
  // Authentication and user context
  const { user } = useAuth();
  const userRole = user?.role;
  const isSalesman = userRole === 'SALESMAN';
  const userFullname = `${user?.firstname} ${user?.lastname}`;

  // Component state
  const [selectedSalesman, setSelectedSalesman] = useState<string | null>(null);

  // Filter entries to only show new clients
  const newClientEntries = useMemo(
    () => (entries || []).filter((e: ReportEntry) => e.new_client === true),
    [entries]
  );

  // Week navigation handlers
  const handlePreviousWeek = () => {
    const newStart = format(addDays(parseISO(weekStart), -7), 'yyyy-MM-dd');
    onWeekChange(newStart);
  };

  const handleNextWeek = () => {
    const newStart = format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd');
    if (parseISO(newStart) <= new Date()) {
      onWeekChange(newStart);
    }
  };

  // Extract unique salesmen from entries
  const salesmen = useMemo(() => 
    Array.from(new Set(newClientEntries.map((e: ReportEntry) => e.salesman_name))).sort(), 
    [newClientEntries]
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

  // Set default salesman selection
  useEffect(() => {
    if (!selectedSalesman && salesmen.length) {
      setSelectedSalesman(isSalesman ? userFullname : salesmen[0] as string);
    }
  }, [salesmen, selectedSalesman, isSalesman, userFullname]);

  // Format week range for display
  const weekRange = `${format(parseISO(weekStart), 'MMM dd')} - ${format(endOfISOWeek(parseISO(weekStart)), 'MMM dd, yyyy')}`;
  
  // Filter entries by selected salesman
  const filteredEntries = newClientEntries.filter(
    (e: ReportEntry) => e.salesman_name === selectedSalesman
  );

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-display">Weekly New Client Orders</h2>
            <p className="text-sm text-slate-500 font-medium">{weekRange}</p>
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
            disabled={isLoading || parseISO(weekStart) >= startOfISOWeek(new Date())}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
            aria-label="Next week"
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Salesman selection tabs (hidden for salesmen) */}
      {!isSalesman && salesmen.length > 0 && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Salesman tabs">
            {salesmen.map((salesman) => (
                <button
                  key={salesman as string}
                  onClick={() => setSelectedSalesman(salesman as string)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    salesman === selectedSalesman
                      ? 'border-emerald-600 text-emerald-600'
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

      {/* Content Area */}
      {filteredEntries.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">
            {selectedSalesman 
              ? `${isSalesman ? 'You have' : 'This salesman has'} no new client orders this week`
              : 'No new client orders for this week'}
          </p>
          <p className="text-slate-400 text-sm mt-1">Try selecting a different week or salesman</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Time Range</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Client Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Order Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} columns={4} />
                ))
              ) : (
                // Data rows
                filteredEntries.map((e: ReportEntry) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-all duration-fast">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        {format(parseISO(e.date), 'MMM dd')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          {e.district}
                        </span>
                        <span className="text-slate-600 font-medium">{e.time_range}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-xs uppercase font-semibold tracking-wide">{e.client_type}:</span>
                          <span className="text-slate-800 font-medium">{e.doctor_name}</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          New Client
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 text-sm">
                        {e.orders && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 font-medium min-w-0">Orders:</span>
                            <span className="text-slate-700">{e.orders}</span>
                          </div>
                        )}
                        {e.tel_orders && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 font-medium min-w-0">Tel Orders:</span>
                            <span className="text-slate-700">{e.tel_orders}</span>
                          </div>
                        )}
                        {e.samples && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 font-medium min-w-0">Samples:</span>
                            <span className="text-slate-700">{e.samples}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WeeklyNewClientOrder;