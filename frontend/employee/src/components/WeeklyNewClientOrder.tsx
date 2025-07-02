import { useState, useEffect, useMemo } from 'react';
import { format, startOfISOWeek, endOfISOWeek, addDays, parseISO } from 'date-fns';
import { useAuth } from '@context/AuthContext';
import { useNameAlias } from '@hooks/useNameAlias';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ReportEntry } from '@interfaces/ReportEntryType';
import { SkeletonRow } from '@components/SkeletonRow';

interface WeeklyNewClientOrderProps {
  entries: ReportEntry[];
  weekStart: string;
  onWeekChange: (newStartDate: string) => void;
  isLoading: boolean;
}

const WeeklyNewClientOrder = ({ entries, weekStart, onWeekChange, isLoading }: WeeklyNewClientOrderProps) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const isSalesman = userRole === 'SALESMAN';
  const userFullname = `${user?.firstname} ${user?.lastname}`;

  const [selectedSalesman, setSelectedSalesman] = useState<string | null>(null);

  const newClientEntries = useMemo(
    () => (entries || []).filter((e: ReportEntry) => e.new_client === true),
    [entries]
  );

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

  const salesmen = useMemo(() => 
    Array.from(new Set(newClientEntries.map((e: ReportEntry) => e.salesman_name))).sort(), 
    [newClientEntries]
  );

  useEffect(() => {
    if (!selectedSalesman && salesmen.length) {
      setSelectedSalesman(isSalesman as boolean ? userFullname as string : salesmen[0] as string);
    }
  }, [salesmen, selectedSalesman, isSalesman, userFullname]);

  const weekRange = `${format(weekStart, 'yyyy-MM-dd')} → ${format(endOfISOWeek(weekStart), 'yyyy-MM-dd')}`;
  const filteredEntries = newClientEntries.filter((e: ReportEntry) => e.salesman_name === selectedSalesman);


  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Weekly New Client Orders ({weekRange})</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousWeek}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={handleNextWeek}
            disabled={isLoading || parseISO(weekStart) >= startOfISOWeek(new Date())}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {!isSalesman && (
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
                >
                  {alias}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {filteredEntries.length === 0 && !isLoading ? (
        <p className="text-center text-gray-500 py-10">No new client orders for this week.</p>
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
              [...Array(5)].map((_, i) => (
                <SkeletonRow key={i} columns={4} />
              ))
            ) : (
              filteredEntries.map((e: ReportEntry) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">{e.date}</td>
                  <td className="px-4 py-2">
                    <strong>{e.district}:</strong> {e.time_range}
                  </td>
                  <td className="px-4 py-2">
                    <strong>{e.client_type.toUpperCase()}:</strong> {e.doctor_name}{' '}
                    <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full shadow-sm">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      New Client
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {e.orders && <div><strong>Orders:</strong> {e.orders}</div>}
                    {e.tel_orders && <div><strong>Tel Orders:</strong> {e.tel_orders}</div>}
                    {e.samples && <div><strong>Samples:</strong> {e.samples}</div>}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WeeklyNewClientOrder;