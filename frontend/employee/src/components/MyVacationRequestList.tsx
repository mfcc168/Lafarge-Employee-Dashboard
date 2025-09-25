import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { backendUrl } from '@configs/DotEnv';
import { useAuth } from '@context/AuthContext';
import { DateItem, VacationRequest } from '@interfaces/index';
import LoadingSpinner from '@components/LoadingSpinner';
import ErrorMessage from '@components/ErrorMessage';

/**
 * MyVacationRequestList Component
 * 
 * Displays a user's vacation requests with:
 * - Tabbed interface for pending vs approved/rejected requests
 * - Responsive grid layout for requests
 * - Loading and error states
 * - Detailed date formatting
 * 
 * returns Vacation request management interface
 */
const MyVacationRequestList = () => {
  // Authentication context
  const { user, accessToken } = useAuth();
  
  // State for active tab selection
  const [activeTab, setActiveTab] = useState<'pending' | 'approvedOrRejected'>('pending');

  /**
   * Fetches the current user's vacation requests from the API
   * @returns {Promise<VacationRequest[]>} Array of vacation requests
   */
  const fetchMyVacationRequests = async () => {
    const res = await axios.get<VacationRequest[]>(`${backendUrl}/api/vacations/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  };

  // React Query for data fetching
  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vacationRequests', user?.username],
    queryFn: fetchMyVacationRequests,
    enabled: !!accessToken, // Only fetch when accessToken is available
  });

  /**
   * Formats date items for display based on their type
   * @param {DateItem} item - The date item to format
   * returns {string} Formatted date string
   */
  const formatDateItem = (item: DateItem) => {
    if (item.type === 'half') return `Half Day - ${item.single_date} ${item.half_day_period}  (${item.leave_type})`;
    if (item.type === 'full') return `Full Day - ${item.from_date} → ${item.to_date}  (${item.leave_type})`;
    return '';
  };

  // Filter requests based on active tab
  const filteredRequests = requests?.filter((req) => {
    if (activeTab === 'pending') {
      return req.status === 'pending';
    } else {
      return req.status === 'approved' || req.status === 'rejected';
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'pending'
                ? 'bg-white shadow text-emerald-600'
                : 'text-gray-500 hover:text-emerald-600'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button
            className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'approvedOrRejected'
                ? 'bg-white shadow text-emerald-600'
                : 'text-gray-500 hover:text-emerald-600'
            }`}
            onClick={() => setActiveTab('approvedOrRejected')}
          >
            Approved / Rejected
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        // Loading state
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        // Error state
        <ErrorMessage message="Failed to fetch vacation requests." type="error"/>
      ) : filteredRequests && filteredRequests.length === 0 ? (
        // Empty state
        <p className="text-center text-gray-500">No vacation requests found for this tab.</p>
      ) : (
        // Success state - Request cards grid
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredRequests?.map((req) => (
            <div 
              key={req.id} 
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow hover:shadow-md transition"
            >
              {/* Request Details */}
              <div className="mb-3">
                <p className="text-lg font-semibold text-gray-800">Request</p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  {req.date_items.map((item, i) => (
                    <li key={i}>{formatDateItem(item)}</li>
                  ))}
                </ul>
              </div>

              {/* Status Indicator */}
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  req.status === 'approved'
                    ? 'text-emerald-600'
                    : req.status === 'rejected'
                    ? 'text-red-500'
                    : 'text-amber-600'
                }`}
              >
                {req.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVacationRequestList;