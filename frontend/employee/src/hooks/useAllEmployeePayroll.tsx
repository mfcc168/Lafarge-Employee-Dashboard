import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { apiUrl, backendUrl } from "@configs/DotEnv";
import { EmployeeProfile } from "interfaces/index";

export const useAllEmployeePayroll = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { user, accessToken } = useAuth();

  const [year, month, prevYear, prevMonth] = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const y = today.getFullYear();
    const m = today.getMonth() + 1; // 1-based

    const isBeforeSalaryDay = day < 10;
    const payrollMonth = isBeforeSalaryDay ? (m === 1 ? 12 : m - 1) : m;
    const payrollYear = isBeforeSalaryDay && m === 1 ? y - 1 : y;
  
    // Commission should be 1 month BEFORE payroll month
    let commissionMonth = payrollMonth - 1;
    let commissionYear = payrollYear;
    if (commissionMonth === 0) {
      commissionMonth = 12;
      commissionYear -= 1;
    }
  
    return [payrollYear, payrollMonth, commissionYear, commissionMonth];
  }, []);

  // Fetch employee salaries
  const { 
    data: profiles = [], 
    isLoading: isLoadingProfiles 
  } = useQuery<EmployeeProfile[]>({
    queryKey: ['employee-salaries', accessToken],
    queryFn: async () => {
      const res = await axios.get(`${backendUrl}/api/salaries/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!accessToken,
  });

  // Fetch commissions
  const { 
    data: commissions = {}, 
    isLoading: isLoadingCommissions 
  } = useQuery<Record<string, number>>({
    queryKey: ['sales-commissions', prevYear, prevMonth, accessToken],
    queryFn: async () => {
      const nameToUsernameMap: Record<string, string> = {
        "Dominic So": "dominic",
        "Alex Cheung": "alex",
        "Matthew Mak": "matthew",
      };

      const res = await axios.get(
        `${apiUrl}/salesmen/commissions/${prevYear}/${prevMonth}/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const commissionMap: Record<string, number> = {};
      res.data.forEach(
        (entry: { salesman: string; commission: number }) => {
          const username = nameToUsernameMap[entry.salesman];
          if (username) {
            commissionMap[username] = entry.commission;
          }
        }
      );
      return commissionMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!accessToken && !!prevYear && !!prevMonth,
  });

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleViewPayrollPDF = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/payroll/pdf/`,
        { profiles, commissions, year, month },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      window.open(url);
    } catch (error) {
      console.error("Failed to load PDF:", error);
    }
  };

  return {
    user,
    profiles,
    expandedId,
    isLoading: isLoadingProfiles || isLoadingCommissions,
    year,
    month,
    commissions,
    toggleExpand,
    handleViewPayrollPDF,
  };
};