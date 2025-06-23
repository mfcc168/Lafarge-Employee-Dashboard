import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@configs/DotEnv";
import { Invoice, SalesmanMonthlyReportData, SalesmanMonthlyReportProps } from "@interfaces/index";

export const useSalesmanMonthlyReport = ({ salesmanName }: SalesmanMonthlyReportProps) => {
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
    [currentDate]
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
  };

  const canGoPrevious = currentSelectedDate > limitMonth;
  const canGoNext = currentSelectedDate < new Date(now.getFullYear(), now.getMonth());
  const year = currentDate.year;
  const month = currentDate.month;

  const fetchData = async () => {
    const response = await axios.get<SalesmanMonthlyReportData>(
      `${apiUrl}/salesman/${salesmanName}/monthly/${year}/${month}/`
    );
    return response.data;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['salesmanMonthlyReport', salesmanName, year, month],
    queryFn: fetchData,
  });

  // Reset expanded week and current page when data changes
  useEffect(() => {
    if (data) {
      setExpandedWeek(null);
      setCurrentPage(1);
    }
  }, [data]);

  const weekRef = useRef<HTMLDivElement>(null);
  const sharedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expandedWeek !== null && weekRef.current) {
      weekRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (sharedExpanded && sharedRef.current) {
      sharedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expandedWeek, currentPage, sharedExpanded]);

  const paginateInvoices = useCallback((invoices: Invoice[]) => {
    const startIndex = (currentPage - 1) * invoicesPerPage;
    const endIndex = startIndex + invoicesPerPage;
    return invoices.slice(startIndex, endIndex);
  }, [currentPage, invoicesPerPage]);

  const handleNextPage = useCallback(() => {
    if (data && expandedWeek !== null) {
      const maxPages = Math.ceil(data.weeks[expandedWeek]?.invoices.length / invoicesPerPage);
      if (currentPage < maxPages) {
        setCurrentPage(currentPage + 1);
      }
    }
  }, [currentPage, data, expandedWeek, invoicesPerPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleExpandWeek = useCallback((weekNumber: number) => {
    if (expandedWeek !== weekNumber) {
      setCurrentPage(1);
    }
    setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
  }, [expandedWeek]);

  return {
    data,
    isLoading,
    error: error?.message || null,
    expandedWeek,
    currentPage,
    invoicesPerPage,
    weekRef,
    sharedRef,
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
    refetch
  };
};