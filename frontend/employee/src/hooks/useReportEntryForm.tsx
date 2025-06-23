import { useState, useEffect, useCallback, useMemo } from "react";
import { ReportEntry } from "@interfaces/index";
import { useAuth } from "@context/AuthContext";
import { backendUrl } from "@configs/DotEnv";
import { useGetAllReportEntries } from "@hooks/useGetAllReportEntries";
import axios from "axios";

export const useReportEntryForm = () => {
  const { accessToken } = useAuth();
  const {
    data: fetchedEntries = [],
    isLoading,
    refetch,
    isFetching,
  } = useGetAllReportEntries();

  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  // Sync local editable state when fetchedEntries change
  useEffect(() => {
    setEntries(fetchedEntries);
  }, [fetchedEntries]);

  const groupedEntriesByDate = useMemo(() => {
    const groups: { [date: string]: ReportEntry[] } = {};
    for (const entry of entries) {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    }
    return groups;
  }, [entries]);

  const sortedDates = useMemo(() => {
    const recentDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    });

    const allDates = new Set([...recentDates, ...Object.keys(groupedEntriesByDate)]);
    return Array.from(allDates).sort((a, b) => b.localeCompare(a));
  }, [groupedEntriesByDate]);

  const pagedDate = sortedDates[currentPage] || today;

  const entriesForCurrentPage = useMemo(
    () => groupedEntriesByDate[pagedDate] || [],
    [groupedEntriesByDate, pagedDate]
  );

  const getGlobalIndex = (localIndex: number): number => {
    const entry = entriesForCurrentPage[localIndex];
    return entries.findIndex((e) => e === entry);
  };

  const addEmptyEntry = useCallback(() => {
    const newEntry: ReportEntry = {
      date: pagedDate,
      time_range: "",
      doctor_name: "",
      district: "",
      client_type: "doctor",
      new_client: false,
      orders: "",
      samples: "",
      tel_orders: "",
      new_product_intro: "",
      old_product_followup: "",
      delivery_time_update: "",
      salesman_name: "",
    };
    setEntries((prev) => [...prev, newEntry]);
    if (!sortedDates.includes(pagedDate)) {
      setCurrentPage(0);
    }
  }, [pagedDate, sortedDates]);

  const handleChange = useCallback(
    <T extends keyof ReportEntry>(index: number, field: T, value: ReportEntry[T]) => {
      setEntries((prev) => {
        const updated = [...prev];
        const globalIndex = getGlobalIndex(index);
        if (globalIndex !== -1) {
          updated[globalIndex] = { ...updated[globalIndex], [field]: value };
        }
        return updated;
      });
    },
    [entries, entriesForCurrentPage]
  );

  const handleSubmitEntry = useCallback(
    async (index: number) => {
      const globalIndex = getGlobalIndex(index);
      const entry = entries[globalIndex];
      if (!entry) return;

      setSubmitting(true);
      try {
        const isUpdate = !!entry.id;
        const url = isUpdate
          ? `${backendUrl}/api/report-entries/${entry.id}/`
          : `${backendUrl}/api/report-entries/`;
        const method = isUpdate ? "PUT" : "POST";

        const response = await axios({
          method,
          url,
          headers: { Authorization: `Bearer ${accessToken}` },
          data: entry,
        });

        if (!entry.id && response.data?.id) {
          const updatedEntry = { ...entry, id: response.data.id };
          setEntries((prev) => {
            const updated = [...prev];
            updated[globalIndex] = updatedEntry;
            return updated;
          });
        }

        await refetch();
      } catch (err) {
        console.error("Submit error:", err);
        alert("Failed to submit entry.");
      } finally {
        setSubmitting(false);
      }
    },
    [entries, accessToken, refetch]
  );

  const handleSubmitAllEntries = useCallback(async () => {
    if (entriesForCurrentPage.length === 0) {
      alert("No entries to submit.");
      return;
    }

    setSubmittingAll(true);
    try {
      await Promise.all(
        entriesForCurrentPage.map(async (entry, i) => {
          const globalIndex = getGlobalIndex(i);
          const isUpdate = !!entry.id;
          const url = isUpdate
            ? `${backendUrl}/api/report-entries/${entry.id}/`
            : `${backendUrl}/api/report-entries/`;
          const method = isUpdate ? "PUT" : "POST";

          const response = await axios({
            method,
            url,
            headers: { Authorization: `Bearer ${accessToken}` },
            data: entry,
          });

          if (!entry.id && response.data?.id) {
            const updatedEntry = { ...entry, id: response.data.id };
            setEntries((prev) => {
              const updated = [...prev];
              updated[globalIndex] = updatedEntry;
              return updated;
            });
          }
        })
      );
      await refetch();
    } catch (err) {
      console.error("Bulk submit error:", err);
      alert("Some entries failed to submit.");
    } finally {
      setSubmittingAll(false);
    }
  }, [entriesForCurrentPage, accessToken, refetch]);

  const handleDelete = useCallback(
    async (index: number) => {
      const globalIndex = getGlobalIndex(index);
      const entry = entries[globalIndex];
      if (!entry) return;

      setDeleting(true);
      try {
        if (entry.id) {
          await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
        setEntries((prev) => prev.filter((_, i) => i !== globalIndex));
        await refetch();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete entry.");
      } finally {
        setDeleting(false);
      }
    },
    [entries, accessToken, refetch]
  );

  const getUniqueSuggestions = useCallback(
    (field: keyof ReportEntry): string[] => {
      const values = entries
        .map((e) => e[field])
        .filter((v) => typeof v === "string" && v.trim() !== "") as string[];
      return Array.from(new Set(values));
    },
    [entries]
  );

  const getTelOrderSuggestions = useCallback(
    (doctorName: string): string[] => {
      const matching = entries.filter((e) => e.doctor_name === doctorName);
      const telOrders = matching
        .map((e) => e.tel_orders?.trim())
        .filter((order) => order !== "");
      return Array.from(new Set(telOrders));
    },
    [entries]
  );

  const timeRangeSuggestions = useMemo(
    () => getUniqueSuggestions("time_range"),
    [getUniqueSuggestions]
  );
  const doctorNameSuggestions = useMemo(
    () => getUniqueSuggestions("doctor_name"),
    [getUniqueSuggestions]
  );
  const districtSuggestions = useMemo(
    () => getUniqueSuggestions("district"),
    [getUniqueSuggestions]
  );

  return {
    entries: entriesForCurrentPage,
    isLoading,
    isFetching,
    submitting,
    submittingAll,
    deleting,
    currentPage,
    sortedDates,
    pagedDate,
    addEmptyEntry,
    handleChange,
    handleSubmitEntry,
    handleSubmitAllEntries,
    handleDelete,
    setCurrentPage,
    totalPages: sortedDates.length,
    timeRangeSuggestions,
    doctorNameSuggestions,
    districtSuggestions,
    getTelOrderSuggestions,
  };
};
