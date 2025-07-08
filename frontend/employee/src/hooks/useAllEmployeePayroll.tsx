import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { apiUrl, backendUrl } from "@configs/DotEnv";
import { EmployeeProfile } from "interfaces/index";

/**
 * useAllEmployeePayroll Custom Hook
 * 
 * Manages employee payroll data with:
 * - Employee salary information
 * - Sales commission data
 * - PDF generation functionality
 * - Automatic payroll month/year calculation
 * - Cached data fetching
 */
export const useAllEmployeePayroll = () => {
  // UI state for expanded items
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { user, accessToken } = useAuth();

  /**
   * Calculates payroll and commission periods
   * - Payroll is for the previous month if before the 10th of current month
   * - Commission is always for the month before payroll month
   */
  const [year, month, prevYear, prevMonth] = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const y = today.getFullYear();
    const m = today.getMonth() + 1; // Convert to 1-based month

    // Determine payroll period (current or previous month)
    const isBeforeSalaryDay = day < 10;
    const payrollMonth = isBeforeSalaryDay ? (m === 1 ? 12 : m - 1) : m;
    const payrollYear = isBeforeSalaryDay && m === 1 ? y - 1 : y;
  
    // Calculate commission period (always month before payroll)
    let commissionMonth = payrollMonth - 1;
    let commissionYear = payrollYear;
    if (commissionMonth === 0) {
      commissionMonth = 12;
      commissionYear -= 1;
    }
  
    return [payrollYear, payrollMonth, commissionYear, commissionMonth];
  }, []);

  /**
   * Fetches employee salary profiles
   */
  const { 
    data: profiles = [], 
    isLoading: isLoadingProfiles,
    isError: isProfilesError,
    error: profilesError 
  } = useQuery<EmployeeProfile[]>({
    queryKey: ['employee-salaries', accessToken],
    queryFn: async () => {
      const res = await axios.get(`${backendUrl}/api/salaries/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!accessToken,
    retry: 2, // Retry failed requests twice
  });

  /**
   * Fetches sales commission data
   */
  const { 
    data: commissions = {}, 
    isLoading: isLoadingCommissions,
    isError: isCommissionsError,
    error: commissionsError 
  } = useQuery<Record<string, number>>({
    queryKey: ['sales-commissions', prevYear, prevMonth, accessToken],
    queryFn: async () => {
      // Map salesman names to usernames
      const nameToUsernameMap: Record<string, string> = {
        "Dominic So": "dominic",
        "Alex Cheung": "alex",
        "Matthew Mak": "matthew",
      };

      const res = await axios.get(
        `${apiUrl}/salesmen/commissions/${prevYear}/${prevMonth}/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Transform commission data into username-keyed object
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
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!accessToken && !!prevYear && !!prevMonth,
    retry: 2, // Retry failed requests twice
  });

  /**
   * Toggles expansion of a payroll item
   * @param {number} id - Employee profile ID to toggle
   */
  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  /**
   * Generates and opens a PDF payroll report
   */
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

      // Create and open PDF blob
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const newWindow = window.open(url, '_blank');
      
      // Ensure window was opened
      if (!newWindow) {
        throw new Error('Popup window was blocked');
      }
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      throw error; // Re-throw for error handling in components
    }
  };

  // Combined loading state
  const isLoading = isLoadingProfiles || isLoadingCommissions;
  // Combined error state
  const isError = isProfilesError || isCommissionsError;
  const error = profilesError || commissionsError;

  return {
    user,
    profiles,
    expandedId,
    isLoading,
    isError,
    error,
    year,
    month,
    commissions,
    toggleExpand,
    handleViewPayrollPDF,
  };
};