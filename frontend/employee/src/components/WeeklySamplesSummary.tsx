import { useState, useEffect, useMemo } from 'react';
import { format, startOfISOWeek, endOfISOWeek, parseISO, addDays } from 'date-fns';
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
 * WeeklySamplesSummary Component
 * 
 * Displays a weekly report of sample distributions with:
 * - Week navigation controls
 * - Salesman filtering (for non-salesman users)
 * - Focuses specifically on sample distributions
 */
const WeeklySamplesSummary = ({ 
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

  // Filter entries to only show those with samples
  const sampleEntries = useMemo(
    () => (entries || []).filter((e: ReportEntry) => e.samples && e.samples.trim() !== ''),
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
    Array.from(new Set(sampleEntries.map((e: ReportEntry) => e.salesman_name))).sort(), 
    [sampleEntries]
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
  const filteredEntries = sampleEntries.filter(
    (e: ReportEntry) => e.salesman_name === selectedSalesman
  );

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-display">Weekly Samples</h2>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">
            {selectedSalesman 
              ? `${isSalesman ? 'You have' : 'This salesman has'} no samples this week`
              : 'No samples distributed this week'}
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
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Samples</th>
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
                        {e.new_client && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            New Client
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="whitespace-pre-line text-slate-700 text-sm leading-relaxed">{e.samples}</div>
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

export default WeeklySamplesSummary;