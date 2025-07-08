import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { backendUrl } from '@configs/DotEnv';
import { useAuth } from '@context/AuthContext';
import { Loader2 } from 'lucide-react';
import { DateItem, VacationRequest } from '@interfaces/index';

/**
 * VacationRequestList Component
 * 
 * Displays and manages vacation requests with:
 * - Tabbed interface for pending vs approved/rejected requests
 * - Approve/reject functionality for pending requests
 * 
 * Features:
 * - Role-based action buttons
 * - Real-time status updates
 * - Automatic tab selection based on request status
 */
const VacationRequestList = () => {
  // Authentication and state management
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pendingOrRejected' | 'approvedOrRejected'>('pendingOrRejected');

  /**
   * Fetches vacation requests from the API
   * returns {Promise<VacationRequest[]>} Array of vacation requests
   */
  const fetchVacationRequests = async () => {
    const res = await axios.get<VacationRequest[]>(`${backendUrl}/api/vacations/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  };

  // Query for fetching vacation requests
  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vacationRequests'],
    queryFn: fetchVacationRequests,
    enabled: !!accessToken, // Only fetch when authenticated
  });

  /**
   * Updates vacation request status
   * @param {Object} params - Update parameters
   * @param {number} params.id - Request ID
   * @param {'approved' | 'rejected'} params.status - New status
   */
  const updateVacationStatus = async ({
    id,
    status,
  }: {
    id: number;
    status: 'approved' | 'rejected';
  }) => {
    const res = await axios.patch(
      `${backendUrl}/api/vacation/${id}/update/`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.data;
  };

  // Mutation for updating request status
  const mutation = useMutation({
    mutationFn: updateVacationStatus,
    onSuccess: (updatedRequest) => {
      // Update the cache with the new status
      queryClient.setQueryData<VacationRequest[]>(['vacationRequests'], (old) => {
        if (!old) return old;
        return old.map((req) =>
          req.id === updatedRequest.id ? updatedRequest : req
        );
      });
    },
  });

  /**
   * Handles approve/reject actions
   * @param {number} id - Request ID
   * @param {'approved' | 'rejected'} status - New status
   */
  const handleApproveReject = (id: number, status: 'approved' | 'rejected') => {
    mutation.mutate({ id, status });
  };

  /**
   * Formats date items for display
   * @param {DateItem} item - Date item to format
   * @returns {string} Formatted date string
   */
  const formatDateItem = (item: DateItem) => {
    if (item.type === 'half') return `Half Day - ${item.single_date} ${item.half_day_period} (${item.leave_type})`;
    if (item.type === 'full') return `Full Day - ${item.from_date} → ${item.to_date} (${item.leave_type})`;
    return '';
  };

  // Filter requests based on active tab
  const filteredRequests = requests?.filter((req) => {
    if (activeTab === 'pendingOrRejected') {
      return req.status === 'pending';
    } else {
      return req.status === 'approved' || req.status === 'rejected';
    }
  });

  // Set default tab based on request statuses
  useEffect(() => {
    if (!requests) return;

    const hasPending = requests.some((req) => req.status === 'pending');
    setActiveTab(hasPending ? 'pendingOrRejected' : 'approvedOrRejected');
  }, [requests]);
  
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Vacation Requests</h2>

      {/* Status Filter Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-100 p-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'pendingOrRejected'}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'pendingOrRejected'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab('pendingOrRejected')}
          >
            Pending
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'approvedOrRejected'}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'approvedOrRejected'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab('approvedOrRejected')}
          >
            Approved / Rejected
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <p className="text-center text-red-600">Failed to fetch vacation requests.</p>
      ) : filteredRequests && filteredRequests.length === 0 ? (
        <p className="text-center text-gray-500">No vacation requests found for this tab.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredRequests?.map((req) => (
            <div 
              key={req.id} 
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow hover:shadow-md transition"
              aria-labelledby={`request-${req.id}-title`}
            >
              <div className="mb-3">
                <p 
                  id={`request-${req.id}-title`}
                  className="text-lg font-semibold text-gray-800 capitalize"
                >
                  {req.employee}
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  {req.date_items.map((item, i) => (
                    <li key={i}>{formatDateItem(item)}</li>
                  ))}
                </ul>
              </div>

              {/* Status Indicator */}
              {req.status !== 'pending' && (
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    req.status === 'approved'
                      ? 'text-green-600'
                      : req.status === 'rejected'
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                  aria-label={`Status: ${req.status}`}
                >
                  {req.status}
                </p>
              )}

              {/* Action Buttons for Pending Requests */}
              {req.status === 'pending' && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleApproveReject(req.id, 'approved')}
                    className="flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition disabled:opacity-50"
                    disabled={mutation.isPending}
                    aria-label={`Approve request from ${req.employee}`}
                  >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                  </button>
                  {/* Uncomment to enable reject functionality
                  <button
                    onClick={() => handleApproveReject(req.id, 'rejected')}
                    className="flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-50"
                    disabled={mutation.isPending}
                    aria-label={`Reject request from ${req.employee}`}
                  >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                  </button> */}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VacationRequestList;