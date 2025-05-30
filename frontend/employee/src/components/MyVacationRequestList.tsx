import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { backendUrl } from '@configs/DotEnv';
import { useAuth } from '@context/AuthContext';
import { Loader2 } from 'lucide-react';
import { DateItem, VacationRequest } from '@interfaces/index';

const MyVacationRequestList = () => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approvedOrRejected'>('pending');

  const fetchMyVacationRequests = async () => {
    const res = await axios.get<VacationRequest[]>(`${backendUrl}/api/vacations/me/`, {
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
    queryKey: ['myVacationRequests'],
    queryFn: fetchMyVacationRequests,
    enabled: !!accessToken,
  });

  const formatDateItem = (item: DateItem) => {
    if (item.type === 'half') return `Half Day - ${item.single_date} ${item.half_day_period}`;
    if (item.type === 'full') return `Full Day - ${item.from_date} → ${item.to_date}`;
    return '';
  };

  const filteredRequests = requests?.filter((req) => {
    if (activeTab === 'pending') {
      return req.status === 'pending';
    } else {
      return req.status === 'approved' || req.status === 'rejected';
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
    

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'pending'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button
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
            <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow hover:shadow-md transition">
              <div className="mb-3">
                <p className="text-lg font-semibold text-gray-800">Request</p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  {req.date_items.map((item, i) => (
                    <li key={i}>{formatDateItem(item)}</li>
                  ))}
                </ul>
              </div>

              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  req.status === 'approved'
                    ? 'text-green-600'
                    : req.status === 'rejected'
                    ? 'text-red-500'
                    : 'text-yellow-600'
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
