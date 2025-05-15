import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "@configs/DotEnv";
import { Invoice, SalesmanMonthlyReportData, SalesmanMonthlyReportProps } from "@interfaces/index";


export const useSalesmanMonthlyReport = ({ salesmanName, year, month }: SalesmanMonthlyReportProps) => {
  const [data, setData] = useState<SalesmanMonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const invoicesPerPage = 5;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<SalesmanMonthlyReportData>(
        `${apiUrl}/salesman/${salesmanName}/monthly/${year}/${month}/`
      );
      setData(response.data);
      setExpandedWeek(null);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Fetch error:", err.response || err.message || err);
      setError("Error fetching data");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [salesmanName, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    error,
    expandedWeek,
    currentPage,
    invoicesPerPage,
    paginateInvoices,
    handleNextPage,
    handlePrevPage,
    handleExpandWeek,
    refetch: fetchData
  };
};