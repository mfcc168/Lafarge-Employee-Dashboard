import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { backendUrl } from '@configs/DotEnv';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useReportEntryForm = () => {
  // State declarations
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [newestEntryIndex, setNewestEntryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { user, accessToken } = useAuth();
  const { showError, showWarning } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const unsavedEntriesRef = useRef<ReportEntry[]>([]);
  const accessTokenRef = useRef(accessToken);
  const fetchRequestIdRef = useRef(0);
  const pendingOperationsRef = useRef(0);
  const queryClient = useQueryClient();

  // Update access token ref
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const beginSubmitting = useCallback(() => {
    pendingOperationsRef.current += 1;
    setSubmitting(true);
  }, []);

  const endSubmitting = useCallback(() => {
    pendingOperationsRef.current = Math.max(0, pendingOperationsRef.current - 1);
    if (pendingOperationsRef.current === 0) {
      setSubmitting(false);
    }
  }, []);

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

    const requestId = ++fetchRequestIdRef.current;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/report-entries/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { date }
      });

      // Ignore an older request that finished after the user changed dates.
      if (requestId !== fetchRequestIdRef.current) return;

      const unsavedForDate = unsavedEntriesRef.current.filter(e => e.date === date);
      const mergedEntries = [...response.data, ...unsavedForDate];
      setEntries(mergedEntries);

    } catch (error) {
      if (requestId === fetchRequestIdRef.current) {
        console.error('Error fetching entries:', error);
      }
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
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
    setNewestEntryIndex(entries.length);
    if (!sortedDates.includes(pagedDate)) {
      setCurrentPage(0);
    }
  }, [pagedDate, sortedDates, entries.length]);

  const getGlobalIndex = useCallback((localIndex: number): number => {
    const entry = entriesForCurrentPage[localIndex];
    return entries.findIndex(e => e === entry);
  }, [entriesForCurrentPage, entries]);

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
  // Memoized helper function to check if entry is blank
  const isBlankEntry = useCallback((entry: ReportEntry) => {
    return (
      !entry.time_range?.trim() &&
      !entry.doctor_name?.trim() &&
      !entry.district?.trim() &&
      !entry.orders?.trim() &&
      !entry.samples?.trim() &&
      !entry.tel_orders?.trim() &&
      !entry.new_product_intro?.trim() &&
      !entry.old_product_followup?.trim() &&
      !entry.delivery_time_update?.trim()
    );
  }, []);

  const handleSubmitEntry = useCallback(async (index: number, skipBlankCheck = false, invalidateCache = true) => {
    const globalIndex = getGlobalIndex(index);
    const entry = entries[globalIndex];
    if (!entry) return;

    // For single submission, show warning if blank
    if (!skipBlankCheck && isBlankEntry(entry)) {
      showWarning(
        'Cannot Submit Entry',
        'Please fill in at least one field before submitting.',
        5000
      );
      return;
    }

    try {
      beginSubmitting();
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
      
      // Invalidate cache for report entries to ensure fresh data
      // This will update the home page and any other views showing report data
      if (invalidateCache) {
        await queryClient.invalidateQueries({ 
          queryKey: ['report-entries'] 
        });
      }
      return true;
    } catch (error) {
      console.error('Error submitting entry:', error);
      showError(
        'Submission Failed',
        'Failed to submit entry. Please check your connection and try again.',
        6000
      );
      return false;
    } finally {
      endSubmitting();
    }
  }, [entries, getGlobalIndex, isBlankEntry, queryClient, beginSubmitting, endSubmitting]);

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
      beginSubmitting();
      await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
      });

      setEntries(prev => prev.filter((_, i) => i !== globalIndex));
      unsavedEntriesRef.current = unsavedEntriesRef.current.filter(
        e => e.id !== entry.id
      );
      
      // Invalidate cache after deletion
      await queryClient.invalidateQueries({ 
        queryKey: ['report-entries'] 
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      showError(
        'Deletion Failed',
        'Failed to delete entry. Please check your connection and try again.',
        6000
      );
    } finally {
      endSubmitting();
    }
  }, [entries, getGlobalIndex, queryClient, beginSubmitting, endSubmitting]);

  const handleSubmitAllEntries = useCallback(async () => {
    if (entriesForCurrentPage.length === 0) {
      showWarning(
        'No Entries Found',
        'There are no entries to submit on this page.',
        4000
      );
      return;
    }

    // Filter out blank entries
    const nonBlankIndices = entriesForCurrentPage
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !isBlankEntry(entry))
      .map(({ index }) => index);

    if (nonBlankIndices.length === 0) {
      showWarning(
        'No Data to Submit',
        'All entries on this page are blank. Please fill in at least one field.',
        5000
      );
      return;
    }

    beginSubmitting();
    try {
      // Child saves participate in the shared pending-operation counter, but
      // cache invalidation happens once after the complete batch.
      const results = await Promise.all(
        nonBlankIndices.map((index) => handleSubmitEntry(index, true, false))
      );

      await queryClient.invalidateQueries({
        queryKey: ['report-entries']
      });

      if (results.some((result) => result === false)) {
        showError(
          'Bulk Submission Failed',
          'Some entries could not be saved. The successful entries were kept.',
          6000
        );
      }

      const skippedCount = entriesForCurrentPage.length - nonBlankIndices.length;
      if (skippedCount > 0) {
        console.log(`Submitted ${nonBlankIndices.length} entries. Skipped ${skippedCount} blank entries.`);
      }
    } catch (error) {
      console.error("Error submitting entries:", error);
      showError(
        'Bulk Submission Failed',
        'Failed to submit some entries. Please check your connection and try again.',
        6000
      );
    } finally {
      endSubmitting();
    }
  }, [
    entriesForCurrentPage,
    handleSubmitEntry,
    isBlankEntry,
    queryClient,
    beginSubmitting,
    endSubmitting,
  ]);

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
    unsavedEntriesRef,
    entries: entriesForCurrentPage,
    newestEntryIndex,
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