import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@context/AuthContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ReportEntry } from '@interfaces/index';
import { useNameAlias } from '@hooks/useNameAlias';
import { format, addDays, parseISO } from 'date-fns';

interface ReportEntryListProps {
  allEntries: ReportEntry[];
  currentDate: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
}

const ReportEntryList = ({ 
  allEntries: entries, 
  currentDate, 
  onDateChange,
  isLoading 
}: ReportEntryListProps) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const isLimitedView = userRole === 'CLERK' || userRole === 'DELIVERYMAN';
  const isSalesman = userRole === 'SALESMAN';
  const userFullname = `${user?.firstname} ${user?.lastname}`;

  const [selectedSalesman, setSelectedSalesman] = useState<string | null>(null);
  const [crossedRows, setCrossedRows] = useState<Set<number>>(new Set());

  const toggleRowCross = (id: number) => {
    if (!isLimitedView) return;
    setCrossedRows((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

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

  const filteredEntries = useMemo(() => 
    (entries || []).filter((entry: ReportEntry) =>
      isSalesman ? entry.salesman_name === userFullname : true
    ),
    [entries, isSalesman, userFullname]
  );

  const salesmen = useMemo(() => 
    Array.from(new Set(filteredEntries.map((e: ReportEntry) => e.salesman_name))).sort(),
    [filteredEntries]
  );

  useEffect(() => {
    if (salesmen.length > 0 && (!selectedSalesman || !salesmen.includes(selectedSalesman))) {
      setSelectedSalesman(String(salesmen[0]));
    }
  }, [salesmen, selectedSalesman]);

  const startOfRangeToMinutes = (range?: string) => {
    if (!range) return 0;
    const [start] = range.split('-');
    const hours = parseInt(start.slice(0, 2), 10);
    const minutes = parseInt(start.slice(2), 10);
    return hours * 60 + minutes;
  };

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

  const today = format(new Date(), 'yyyy-MM-dd');
  const hasNext = currentDate < today;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Daily Reports ({currentDate})</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousDay}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={handleNextDay}
            disabled={!hasNext || isLoading}
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
        <p className="text-center text-gray-500 py-10">No daily report for today.</p>
      ) : (
      <div className="overflow-x-auto rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-700">
            <tr>
              <th className="px-4 py-2">Time Range</th>
              <th className="px-4 py-2">Client Info</th>
              <th className="px-4 py-2">Order Info</th>
              {!isLimitedView && <th className="px-4 py-2">Product Discussion</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {(isLimitedView
              ? sortedEntries.filter((entry) => entry.orders || entry.samples || entry.tel_orders)
              : sortedEntries
            ).map((entry, idx) => (
              <tr
                key={entry.id ?? `${entry.salesman_name}-${entry.date}-${idx}`}
                onClick={() => entry.id && toggleRowCross(Number(entry.id))}
                className={`cursor-pointer ${
                  isLimitedView && crossedRows.has(Number(entry.id)) ? 'line-through text-gray-400' : ''
                }`}
              >
                <td className="px-4 py-2">
                  <div><strong>{entry.district}:</strong> {entry.time_range}</div>
                </td>
                <td className="px-4 py-2">
                  <strong>{entry.client_type.toUpperCase()}:</strong> {entry.doctor_name}{' '}
                  {entry.new_client && (
                    <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full shadow-sm">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      New
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs">
                  {entry.orders && <div><strong>Orders:</strong> {entry.orders}</div>}
                  {entry.tel_orders && <div><strong>Tel Orders:</strong> {entry.tel_orders}</div>}
                  {entry.samples && <div><strong>Samples:</strong> {entry.samples}</div>}
                </td>
                {!isLimitedView && (
                  <td className="px-4 py-2 text-xs">
                    {entry.new_product_intro && <div><strong>Intro:</strong> {entry.new_product_intro}</div>}
                    {entry.old_product_followup && <div><strong>Follow-up:</strong> {entry.old_product_followup}</div>}
                    {entry.delivery_time_update && <div><strong>Delivery:</strong> {entry.delivery_time_update}</div>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    </div>
  );
};

export default ReportEntryList;