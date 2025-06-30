import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { backendUrl } from '@configs/DotEnv';
import { useQuery } from '@tanstack/react-query';

export const useReportEntryForm = () => {
  // State declarations
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { user, accessToken } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const unsavedEntriesRef = useRef<ReportEntry[]>([]);
  const accessTokenRef = useRef(accessToken);

  // Update access token ref
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Memoized calculations
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
    const recentDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const allDates = new Set([
      ...recentDates,
      ...Object.keys(groupedEntriesByDate),
    ]);

    return Array.from(allDates).sort((a, b) => b.localeCompare(a));
  }, [groupedEntriesByDate]);

  const pagedDate = sortedDates[currentPage] || today;
  const entriesForCurrentPage = useMemo(() => {
    return groupedEntriesByDate[pagedDate] || [];
  }, [groupedEntriesByDate, pagedDate]);

  
  const { data: allEntriesData = [], isLoading: isLoadingSuggestions } = useQuery({
      queryKey: ['report-entries', user?.username],
      queryFn: async () => {
        if (!accessToken) throw new Error('No token');
        const response = await axios.get(`${backendUrl}/api/report-entries/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data as ReportEntry[];
      },
      enabled: !!accessToken, // only run when token is available
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 10, // 10 minutes total cache time
    });




  const fetchEntries = useCallback(async (date: string) => {
    const token = accessTokenRef.current;
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/report-entries/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { date }
      });

      // Merge with unsaved entries for this date
      const unsavedForDate = unsavedEntriesRef.current.filter(e => e.date === date);
      const mergedEntries = [...response.data, ...unsavedForDate];
      setEntries(mergedEntries);

    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data when date changes
  useEffect(() => {
    fetchEntries(pagedDate);
  }, [pagedDate, fetchEntries]);

  // Entry manipulation functions
  const addEmptyEntry = useCallback(() => {
    const newEntry: ReportEntry = {
      date: pagedDate,
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
    };

    setEntries(prev => [...prev, newEntry]);
    unsavedEntriesRef.current = [...unsavedEntriesRef.current, newEntry];

    if (!sortedDates.includes(pagedDate)) {
      setCurrentPage(0);
    }
  }, [pagedDate, sortedDates]);

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
      const updatedEntry = {
        ...updatedEntries[index],
        [field]: value
      };
      updatedEntries[index] = updatedEntry;

      // Update unsaved entries
      unsavedEntriesRef.current = unsavedEntriesRef.current.map(entry => 
        entry === prevEntries[index] ? updatedEntry : entry
      );

      return updatedEntries;
    });
  }, []);

  // CRUD operations
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
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        data: entry,
      });

      if (!entry.id && response.data?.id) {
        const updatedEntry = { ...entry, id: response.data.id };
        setEntries(prev => {
          const updated = [...prev];
          updated[globalIndex] = updatedEntry;
          return updated;
        });
        
        // Remove from unsaved entries
        unsavedEntriesRef.current = unsavedEntriesRef.current.filter(
          e => e !== entry
        );
      }
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Failed to submit entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, entriesForCurrentPage]);

  const handleDelete = useCallback(async (index: number) => {
    const globalIndex = getGlobalIndex(index);
    const entry = entries[globalIndex];
    if (!entry) return;

    if (!entry.id) {
      setEntries(prev => prev.filter((_, i) => i !== globalIndex));
      unsavedEntriesRef.current = unsavedEntriesRef.current.filter(
        e => e !== entry
      );
      return;
    }

    try {
      setSubmitting(true);
      await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
      });

      setEntries(prev => prev.filter((_, i) => i !== globalIndex));
      unsavedEntriesRef.current = unsavedEntriesRef.current.filter(
        e => e.id !== entry.id
      );
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, entriesForCurrentPage]);

  const handleSubmitAllEntries = useCallback(async () => {
    if (entriesForCurrentPage.length === 0) {
      alert("No entries to submit on this page.");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(entriesForCurrentPage.map(async (_, index) => {
        await handleSubmitEntry(index);
      }));
    } catch (error) {
      console.error("Error submitting entries:", error);
      alert("Failed to submit some entries.");
    } finally {
      setSubmitting(false);
    }
  }, [entriesForCurrentPage, handleSubmitEntry]);

  // Suggestion functions
  const getUniqueSuggestions = useCallback((field: keyof ReportEntry): string[] => {
    const values = allEntriesData
      .map(entry => entry[field])
      .filter(v => typeof v === 'string' && v.trim() !== '') as string[];
    return Array.from(new Set(values));
  }, [allEntriesData]);

  const getTelOrderSuggestions = (doctorName: string): string[] => {
    const matches = allEntriesData.length > 0 
      ? allEntriesData.filter(e => e.doctor_name === doctorName && e.tel_orders?.trim())
      : entries.filter(e => e.doctor_name === doctorName && e.tel_orders?.trim());
    
    return [...new Set(matches.map(e => e.tel_orders.trim()))];
  };

  // Memoized suggestions
  const timeRangeSuggestions = useMemo(() => getUniqueSuggestions('time_range'), [getUniqueSuggestions]);
  const doctorNameSuggestions = useMemo(() => getUniqueSuggestions('doctor_name'), [getUniqueSuggestions]);
  const districtSuggestions = useMemo(() => getUniqueSuggestions('district'), [getUniqueSuggestions]);

  return {
    entries: entriesForCurrentPage,
    isLoading,
    isLoadingSuggestions,
    submitting,
    currentPage,
    sortedDates,
    pagedDate,
    timeRangeSuggestions,
    doctorNameSuggestions,
    districtSuggestions,
    getTelOrderSuggestions,
    addEmptyEntry,
    handleChange,
    handleSubmitAllEntries,
    handleSubmitEntry,
    handleDelete,
    setCurrentPage,
    totalPages: sortedDates.length,
  };
};