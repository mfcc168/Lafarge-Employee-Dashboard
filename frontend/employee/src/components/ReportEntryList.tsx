import { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '@configs/DotEnv';
import { useAuth } from '@context/AuthContext';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { ReportEntry } from '@interfaces/index';

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const ReportEntryList = () => {
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>(formatDate(new Date()));
  const [selectedSalesman, setSelectedSalesman] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchReportEntries = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/all-report-entries/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setEntries(response.data);
      } catch (error) {
        console.error('Error fetching report entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportEntries();
  }, [accessToken]);

  const availableDates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse(); // latest to earliest

  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      const today = formatDate(new Date());
      if (availableDates.includes(today)) {
        setCurrentDate(today);
      } else {
        setCurrentDate(availableDates[0]);
      }
    }
  }, [isLoading, entries]);

  // Entries filtered by selected date
  const filteredEntries = entries.filter((entry) => entry.date === currentDate);

  // Distinct salesman names for the current date
  const salesmen = Array.from(new Set(filteredEntries.map((e) => e.salesman_name))).sort();

  // When the current date or filtered entries change, reset selected salesman if needed
  useEffect(() => {
    if (salesmen.length > 0) {
      if (!selectedSalesman || !salesmen.includes(selectedSalesman)) {
        setSelectedSalesman(salesmen[0]);
      }
    } else {
      setSelectedSalesman(null);
    }
  }, [currentDate, salesmen]);

  // Entries for the selected salesman
  const salesmanEntries = filteredEntries.filter((entry) => entry.salesman_name === selectedSalesman);

  const currentIndex = availableDates.indexOf(currentDate);
  const hasPrevious = currentIndex < availableDates.length - 1;
  const hasNext = currentIndex > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Report Entries ({currentDate})</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => hasPrevious && setCurrentDate(availableDates[currentIndex + 1])}
            disabled={!hasPrevious}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => hasNext && setCurrentDate(availableDates[currentIndex - 1])}
            disabled={!hasNext}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : salesmen.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No entries for {currentDate}.</div>
      ) : (
        <>
          {/* Tabs for salesmen */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Salesman tabs">
              {salesmen.map((salesman) => (
                <button
                  key={salesman}
                  onClick={() => setSelectedSalesman(salesman)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    salesman === selectedSalesman
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {salesman}
                </button>
              ))}
            </nav>
          </div>

          {/* Table for selected salesman */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">{selectedSalesman}</h3>
            <div className="overflow-x-auto rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Time Range</th>
                    <th className="px-4 py-2">Client Info</th>
                    <th className="px-4 py-2">Order Info</th>
                    <th className="px-4 py-2">Product Discussion</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {salesmanEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2">
                        <div>
                          <strong>{entry.district}:</strong> {entry.time_range}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <strong>{entry.client_type.toUpperCase()}:</strong> {entry.doctor_name}{' '}
                        {entry.new_client && (
                          <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full shadow-sm transition duration-300 ease-in-out hover:bg-green-200">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3 h-3 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            New
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2 text-xs">
                        {entry.orders && (
                          <div>
                            <strong>Orders:</strong> {entry.orders}
                          </div>
                        )}
                        {entry.tel_orders && (
                          <div>
                            <strong>Tel Orders:</strong> {entry.tel_orders}
                          </div>
                        )}
                        {entry.samples && (
                          <div>
                            <strong>Samples:</strong> {entry.samples}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {entry.new_product_intro && (
                          <div>
                            <strong>New:</strong> {entry.new_product_intro}
                          </div>
                        )}
                        {entry.old_product_followup && (
                          <div>
                            <strong>Follow-up:</strong> {entry.old_product_followup}
                          </div>
                        )}
                        {entry.delivery_time_update && (
                          <div>
                            <strong>Delivery:</strong> {entry.delivery_time_update}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportEntryList;
