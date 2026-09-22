import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { backendUrl } from '@configs/DotEnv';
import { useAuth } from '@context/AuthContext';
import { Loader2 } from 'lucide-react';
import { DateItem, VacationRequest } from '@interfaces/index';
import { LazyVacationRequestForm as VacationRequestForm } from '@components/LazyComponents';
import MyVacationRequestList from '@components/MyVacationRequestList';
import { ALL_MANAGEMENT, hasRole } from '@utils/permissions';

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
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const isManagement = hasRole(user?.role, ALL_MANAGEMENT);
  const [activeTab, setActiveTab] = useState<'pending' | 'approvedOrRejected' | 'myRequests'>('pending');

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
    if (activeTab === 'pending') {
      return req.status === 'pending' && (isManagement || req.employee === user?.username);
    }

    if (activeTab === 'approvedOrRejected') {
      const isApprovedOrRejected = req.status === 'approved' || req.status === 'rejected';
      if (!isApprovedOrRejected) return false;
      return isManagement || req.employee === user?.username;
    }

    if (activeTab === 'myRequests') {
      return req.employee === user?.username;
    }

    return false;
  });

  // Set default tab based on request statuses
  useEffect(() => {
    if (!requests || activeTab !== 'pending') return;

    const hasPending = requests.some((req) => req.status === 'pending');
    if (!hasPending) {
      setActiveTab('approvedOrRejected');
    }
  }, [requests, activeTab]);

  const isMyRequestsTab = activeTab === 'myRequests';
  
  return (
    <div className="max-w-5xl mx-auto px-8 py-8 bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal border border-gray-100 animate-scaleIn">
      <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center font-display">Vacation Requests</h2>

      {/* Status Filter Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-100 p-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'pending'}
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
            role="tab"
            aria-selected={activeTab === 'approvedOrRejected'}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'approvedOrRejected'
                ? 'bg-white shadow text-emerald-600'
                : 'text-gray-500 hover:text-emerald-600'
            }`}
            onClick={() => setActiveTab('approvedOrRejected')}
          >
            Approved / Rejected
          </button>
          {user && (
            <button
              role="tab"
              aria-selected={activeTab === 'myRequests'}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'myRequests'
                  ? 'bg-white shadow text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
              onClick={() => setActiveTab('myRequests')}
            >
              My Requests
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isMyRequestsTab ? (
        <div className="space-y-10">
          <VacationRequestForm />
          <MyVacationRequestList />
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : isError ? (
        <p className="text-center text-error-600">Failed to fetch vacation requests.</p>
      ) : filteredRequests && filteredRequests.length === 0 ? (
        <p className="text-center text-gray-500">No vacation requests found for this tab.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredRequests?.map((req) => (
            <div 
              key={req.id} 
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-soft hover:shadow-strong transition-all duration-normal"
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

              {req.signature_data && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee Signature
                  </p>
                  <div className="mt-2 bg-white border border-gray-200 rounded-xl p-2">
                    <img
                      src={req.signature_data}
                      alt={`Signature from ${req.employee}`}
                      className="w-full h-32 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Status Indicator */}
              {req.status !== 'pending' && (
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    req.status === 'approved'
                      ? 'text-emerald-600'
                      : req.status === 'rejected'
                      ? 'text-error-500'
                      : 'text-gray-400'
                  }`}
                  aria-label={`Status: ${req.status}`}
                >
                  {req.status}
                </p>
              )}

              {/* Action Buttons for Pending Requests */}
              {req.status === 'pending' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleApproveReject(req.id, 'approved')}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-medium transition-all duration-fast shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105"
                    disabled={mutation.isPending}
                    aria-label={`Approve request from ${req.employee}`}
                  >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleApproveReject(req.id, 'rejected')}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium transition-all duration-fast shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105"
                    disabled={mutation.isPending}
                    aria-label={`Reject request from ${req.employee}`}
                  >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                  </button>
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
