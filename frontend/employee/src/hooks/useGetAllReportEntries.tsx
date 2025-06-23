import { useAuth } from "@context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";

export const useGetAllReportEntries = () => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["allReportEntries"],
    queryFn: () =>
      axios
        .get(`${backendUrl}/api/all-report-entries/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => res.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
};
