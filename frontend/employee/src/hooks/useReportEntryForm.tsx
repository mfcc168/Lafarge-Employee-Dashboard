import { useState, useEffect, useCallback, useMemo } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { backendUrl } from '@configs/DotEnv';

export const useReportEntryForm = () => {
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collapsedStates, setCollapsedStates] = useState<boolean[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const { accessToken } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const groupedEntriesByDate = useMemo(() => {
    const groups: { [date: string]: ReportEntry[] } = {};
    for (const entry of entries) {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    }
    return groups;
  }, [entries]);

  const sortedDates = useMemo(() => {
    const dates = new Set(Object.keys(groupedEntriesByDate));
    dates.add(today);
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [groupedEntriesByDate, today]);

  const pagedDate = sortedDates[currentPage] || today;

  const entriesForCurrentPage = useMemo(() => {
    return groupedEntriesByDate[pagedDate] || [];
  }, [groupedEntriesByDate, pagedDate]);



  const fetchEntries = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/report-entries/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    setCollapsedStates(Array(entriesForCurrentPage.length).fill(true));
  }, [currentPage]);

  const addEmptyEntry = useCallback(() => {
    setEntries(prevEntries => [
      ...prevEntries,
      {
        date: today,
        time_range: '',
        doctor_name: '',
        district: '',
        client_type: 'doctor',
        new_client: false,
        orders: '',
        samples: '',
        tel_orders: '',
        new_product_intro: '',
        old_product_followup: '',
        delivery_time_update: '',
        salesman_name: '',
      },
    ]);
  }, [today]);

  const getGlobalIndex = (localIndex: number): number => {
    const entry = entriesForCurrentPage[localIndex];
    return entries.findIndex(e => e === entry);
  };

  const handleChange = useCallback(<T extends keyof ReportEntry>(
    index: number,
    field: T,
    value: ReportEntry[T]
  ) => {
    setEntries(prevEntries => {
      const updatedEntries = [...prevEntries];
      const globalIndex = getGlobalIndex(index);
      if (globalIndex !== -1) {
        updatedEntries[globalIndex] = {
          ...updatedEntries[globalIndex],
          [field]: value,
        };
      }
      return updatedEntries;
    });
  }, [entries, entriesForCurrentPage]);

  const handleSubmitEntry = useCallback(async (index: number) => {
    const globalIndex = getGlobalIndex(index);
    const entry = entries[globalIndex];
    if (!entry) return;

    try {
      setSubmitting(true);
      const isUpdate = !!entry.id;
      const url = isUpdate
        ? `${backendUrl}/api/report-entries/${entry.id}/`
        : `${backendUrl}/api/report-entries/`;
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: entry,
      });

    // If entry is new, the backend will provide an ID, update the entry
    if (!entry.id && response.data?.id) {
      const updatedEntry = { ...entry, id: response.data.id }; // Assuming backend responds with the real ID
      setEntries(prevEntries => {
        const updatedEntries = [...prevEntries];
        updatedEntries[globalIndex] = updatedEntry; // Update the specific entry
        return updatedEntries;
      });
    }
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Failed to submit entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, entriesForCurrentPage, accessToken]);

  const handleDelete = useCallback(async (index: number) => {
    const globalIndex = getGlobalIndex(index);
    const entry = entries[globalIndex];
    if (!entry) return;

    if (!entry.id) {
      setEntries(prevEntries => prevEntries.filter((_, i) => i !== globalIndex));
      return;
    }

    try {
      setSubmitting(true);
      await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setEntries(prevEntries => prevEntries.filter((_, i) => i !== globalIndex));
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, entriesForCurrentPage, accessToken]);

  const toggleCollapse = (index: number) => {
    setCollapsedStates(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  return {
    entries: entriesForCurrentPage,
    isLoading,
    submitting,
    collapsedStates,
    currentPage,
    sortedDates,
    pagedDate,
    addEmptyEntry,
    handleChange,
    handleSubmitEntry,
    handleDelete,
    toggleCollapse,
    setCurrentPage,
    totalPages: sortedDates.length,
  };
}