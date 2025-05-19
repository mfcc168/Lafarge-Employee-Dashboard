  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import axios from 'axios';
  import { backendUrl } from '@configs/DotEnv';
  import { useAuth } from '@context/AuthContext';
  import { Loader2 } from 'lucide-react';
  import { DateItem, VacationRequest } from '@interfaces/index';


  const VacationRequestList = () => {
    const { accessToken } = useAuth();
    const queryClient = useQueryClient();

    const fetchVacationRequests = async () => {
      const res = await axios.get<VacationRequest[]>(`${backendUrl}/api/vacations/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return res.data;
    };

    const {
      data: requests,
      isLoading,
      isError,
    } = useQuery({
      queryKey: ['vacationRequests'],
      queryFn: () => fetchVacationRequests(),
      enabled: !!accessToken,
    });

    
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


    const mutation = useMutation({
      mutationFn: ({ id, status }: { id: number; status: 'approved' | 'rejected' }) =>
        updateVacationStatus({ id, status }),
      onSuccess: (updatedRequest) => {
        queryClient.setQueryData<VacationRequest[]>(['vacationRequests'], (old) => {
          if (!old) return old;
          return old.map((req) =>
            req.id === updatedRequest.id ? updatedRequest : req
          );
        });
      },
    });
    

    const handleApproveReject = (id: number, status: 'approved' | 'rejected') => {
      mutation.mutate({ id, status });
    };

    const formatDateItem = (item: DateItem) => {
      if (item.type === 'half') return `Half Day - ${item.single_date}`;
      if (item.type === 'full') return `Full Day - ${item.from_date} → ${item.to_date}`;
      return '';
    };

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          All Vacation Requests
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <p className="text-red-600">Failed to fetch vacation requests.</p>
        ) : requests && requests.length === 0 ? (
          <p className="text-gray-600">No vacation requests found.</p>
        ) : (
          <div className="space-y-6">
            {requests?.map((req) => (
              <div key={req.id} className=" p-4 rounded-lg bg-gray-50 shadow-sm">
                <p className="font-medium text-gray-800">Request from {req.employee}</p>
                <ul className="list-disc list-inside text-gray-700 mt-2">
                  {req.date_items.map((item, i) => (
                    <li key={i}>{formatDateItem(item)}</li>
                  ))}
                </ul>
                {req.status !== 'pending' && (
                  <p
                    className={`mt-2 text-sm uppercase ${
                      req.status === 'approved'
                        ? 'text-green-600'
                        : req.status === 'rejected'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {req.status}
                  </p>
                )}
                <div className="mt-4 flex gap-4">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveReject(req.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Approve'
                        )}
                      </button>
                      <button
                        onClick={() => handleApproveReject(req.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Reject'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  export default VacationRequestList;