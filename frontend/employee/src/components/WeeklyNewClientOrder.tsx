import { useState, useEffect, useMemo } from 'react';
import { format, startOfISOWeek, endOfISOWeek, addDays, parseISO } from 'date-fns';
import { useAuth } from '@context/AuthContext';
import { useNameAlias } from '@hooks/useNameAlias';
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
    <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
      {/* Header with week navigation */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Weekly New Client Orders ({weekRange})
        </h2>
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
            {salesmen.map((salesman) => {
              const alias = useNameAlias(salesman as string);
              return (
                <button
                  key={salesman as string}
                  onClick={() => setSelectedSalesman(salesman as string)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    salesman === selectedSalesman
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={salesman === selectedSalesman ? 'page' : undefined}
                >
                  {alias}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Content Area */}
      {filteredEntries.length === 0 && !isLoading ? (
        <p className="text-center text-gray-500 py-10">
          {selectedSalesman 
            ? `${isSalesman ? 'You have' : 'This salesman has'} no new client orders this week`
            : 'No new client orders for this week'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-700">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time Range</th>
                <th className="px-4 py-2">Client Info</th>
                <th className="px-4 py-2">Order Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} columns={4} />
                ))
              ) : (
                // Data rows
                filteredEntries.map((e: ReportEntry) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-2">
                      <strong>{e.district}:</strong> {e.time_range}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <strong className="capitalize">{e.client_type}:</strong>
                        <span className="ml-1">{e.doctor_name}</span>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          New Client
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {e.orders && (
                        <div className="mb-1">
                          <strong>Orders:</strong> {e.orders}
                        </div>
                      )}
                      {e.tel_orders && (
                        <div className="mb-1">
                          <strong>Tel Orders:</strong> {e.tel_orders}
                        </div>
                      )}
                      {e.samples && (
                        <div>
                          <strong>Samples:</strong> {e.samples}
                        </div>
                      )}
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