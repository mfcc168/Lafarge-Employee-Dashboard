import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { backendUrl } from "@configs/DotEnv";

export const useGetAllReportEntries = () => {
  const { accessToken } = useAuth();

  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const res = await axios.get(`${backendUrl}/api/all-report-entries/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setEntries(res.data);
      } catch (error) {
        console.error("Failed to fetch report entries:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  return {
    entries,
    isLoading,
    isError,
  };
};
