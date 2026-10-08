import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@configs/DotEnv";
import {
  Invoice,
  SalesmanMonthlyReportData,
  SalesmanMonthlyReportProps,
} from "@interfaces/index";

export const useSalesmanMonthlyReport = ({
  salesmanName,
}: SalesmanMonthlyReportProps) => {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sharedExpanded, setSharedExpanded] = useState<boolean>(false);
  const toggleSharedExpanded = () => setSharedExpanded((prev) => !prev);
  const invoicesPerPage = 5;
  const limitMonth = new Date(2025, 1);

  const now = new Date();

  const [currentDate, setCurrentDate] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const currentSelectedDate = useMemo(
    () => new Date(currentDate.year, currentDate.month - 1),
    [currentDate],
  );

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentDate((prev) => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { year: newYear, month: newMonth };
    });
    setExpandedWeek(null);
    setCurrentPage(1);
    setSharedExpanded(false);
  };

  const canGoPrevious = currentSelectedDate > limitMonth;
  const canGoNext =
    currentSelectedDate < new Date(now.getFullYear(), now.getMonth());
  const year = currentDate.year;
  const month = currentDate.month;

  const fetchData = async () => {
    const response = await axios.get<SalesmanMonthlyReportData>(
      `${apiUrl}/salesman/${salesmanName}/monthly/${year}/${month}/`,
    );
    return response.data;
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["salesmanMonthlyReport", salesmanName, year, month],
    queryFn: fetchData,
  });

  // Background refreshes preserve the chosen section; shorter lists clamp pagination.
  const pageCount =
    expandedWeek === null
      ? 1
      : Math.max(
          1,
          Math.ceil(
            (data?.weeks[expandedWeek]?.invoices.length || 0) / invoicesPerPage,
          ),
        );
  const visiblePage = Math.min(currentPage, pageCount);

  const paginateInvoices = useCallback(
    (invoices: Invoice[]) => {
      const startIndex = (visiblePage - 1) * invoicesPerPage;
      const endIndex = startIndex + invoicesPerPage;
      return invoices.slice(startIndex, endIndex);
    },
    [visiblePage, invoicesPerPage],
  );

  const handleNextPage = useCallback(() => {
    if (data && expandedWeek !== null) {
      const maxPages = Math.ceil(
        data.weeks[expandedWeek]?.invoices.length / invoicesPerPage,
      );
      if (visiblePage < maxPages) {
        setCurrentPage(visiblePage + 1);
      }
    }
  }, [visiblePage, data, expandedWeek, invoicesPerPage]);

  const handlePrevPage = useCallback(() => {
    if (visiblePage > 1) {
      setCurrentPage(visiblePage - 1);
    }
  }, [visiblePage]);

  const handleExpandWeek = useCallback(
    (weekNumber: number) => {
      if (expandedWeek !== weekNumber) {
        setCurrentPage(1);
      }
      setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
    },
    [expandedWeek],
  );

  return {
    data,
    isLoading,
    isFetching,
    error: error?.message || null,
    expandedWeek,
    currentPage: visiblePage,
    invoicesPerPage,
    currentDate,
    currentSelectedDate,
    canGoPrevious,
    canGoNext,
    sharedExpanded,
    toggleSharedExpanded,
    navigateMonth,
    paginateInvoices,
    handleNextPage,
    handlePrevPage,
    handleExpandWeek,
    refetch,
  };
};
