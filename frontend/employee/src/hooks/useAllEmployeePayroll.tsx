import { useEffect, useMemo, useState } from "react";
import { EmployeeProfile } from "interfaces/index";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { apiUrl, backendUrl } from "@configs/DotEnv";


export const useAllEmployeePayroll = () => {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [commissions, setCommissions] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        // Fetch all employee salaries
        const res = await axios.get<EmployeeProfile[]>(
          `${backendUrl}/api/salaries/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        setProfiles(res.data);

        // Fetch all commissions from backend
        const commissionRes = await axios.get(
          `${apiUrl}/salesmen/commissions/${prevYear}/${prevMonth}/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const nameToUsernameMap: Record<string, string> = {
          "Dominic So": "dominic",
          "Alex Cheung": "alex",
          "Matthew Mak": "matthew",
        };

        const commissionMap: Record<string, number> = {};
        commissionRes.data.forEach(
          (entry: { salesman: string; commission: number }) => {
            const username = nameToUsernameMap[entry.salesman];
            if (username) {
              commissionMap[username] = entry.commission;
            }
          }
        );

        setCommissions(commissionMap);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load payroll or commissions", error);
        setIsLoading(false);
      }
    };

    fetchPayroll();
  }, [accessToken, year, month]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };





  return {
    user,
    profiles,
    expandedId,
    isLoading,
    year,
    month,
    commissions,
    toggleExpand,
  };
};