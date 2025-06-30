import { useQuery } from '@tanstack/react-query';
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { backendUrl } from "@configs/DotEnv";
import { ReportEntry } from '@interfaces/index';


export const useGetAllReportEntries = () => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['report-entries', 'all-entries'],
    queryFn: async () => {
      if (!accessToken) throw new Error('No token');
      const response = await axios.get(`${backendUrl}/api/all-report-entries/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data as ReportEntry[];
    },
    enabled: !!accessToken, // only run when token is available
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes total cache time
  });
};
