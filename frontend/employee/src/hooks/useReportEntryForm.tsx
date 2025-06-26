import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { backendUrl } from '@configs/DotEnv';

export const useReportEntryForm = () => {
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const { accessToken, user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Cache for entries by date
  const entriesCache = useRef<Record<string, ReportEntry[]>>({});
  const accessTokenRef = useRef(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Memoized fetch functions
  const fetchAvailableDates = useCallback(async () => {
    try {
      setIsLoadingDates(true);
      const response = await axios.get(`${backendUrl}/api/report-entry-dates/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      const dates = response.data.map((date: string) => date.split('T')[0]);
      const recentDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });

      const allDates = new Set([...recentDates, ...dates]);
      const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
      
      setAvailableDates(sortedDates);
      const todayIndex = sortedDates.indexOf(today);
      setCurrentPage(todayIndex !== -1 ? todayIndex : 0);
    } catch (error) {
      console.error('Error fetching dates:', error);
    } finally {
      setIsLoadingDates(false);
    }
  }, [accessToken, today]);

  const fetchEntries = useCallback(async (date: string) => {
    if (!accessTokenRef.current) return;
    
    // Return cached data if available
    if (entriesCache.current[date]) {
      setEntries(entriesCache.current[date]);
      setIsLoadingEntries(false);
      return;
    }

    try {
      setIsLoadingEntries(true);
      const response = await axios.get(`${backendUrl}/api/all-report-entries/`, {
        params: { date },
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
      });
      
      // Update cache and state
      entriesCache.current[date] = response.data;
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  // Initial load and date change effects
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchAvailableDates();
      if (availableDates.length > 0) {
        await fetchEntries(availableDates[currentPage]);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (availableDates.length > 0 && currentPage < availableDates.length) {
      fetchEntries(availableDates[currentPage]);
    }
  }, [currentPage, availableDates, fetchEntries]);

  const pagedDate = availableDates[currentPage] || today;

  // Memoized suggestions
  const getUniqueSuggestions = useCallback((field: keyof ReportEntry): string[] => {
    const allEntries = Object.values(entriesCache.current).flat();
    const values = allEntries
      .map(entry => entry[field])
      .filter(v => typeof v === 'string' && v.trim() !== '') as string[];
    return Array.from(new Set(values));
  }, []);

  const getTelOrderSuggestions = useCallback((doctorName: string): string[] => {
    const allEntries = Object.values(entriesCache.current).flat();
    const matchingEntries = allEntries.filter(entry => entry.doctor_name === doctorName);
    const telOrders = matchingEntries
      .map(entry => entry.tel_orders.trim())
      .filter(order => order !== '');
    return Array.from(new Set(telOrders));
  }, []);

  // Memoized to prevent unnecessary recalculations
  const timeRangeSuggestions = useMemo(() => getUniqueSuggestions('time_range'), [getUniqueSuggestions]);
  const doctorNameSuggestions = useMemo(() => getUniqueSuggestions('doctor_name'), [getUniqueSuggestions]);
  const districtSuggestions = useMemo(() => getUniqueSuggestions('district'), [getUniqueSuggestions]);

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
      salesman_name: user?.username || '',
    };

    setEntries(prev => [...prev, newEntry]);
  }, [pagedDate, user?.username]);

  const handleChange = useCallback(<T extends keyof ReportEntry>(
    index: number,
    field: T,
    value: ReportEntry[T]
  ) => {
    setEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleSubmitEntry = useCallback(async (index: number) => {
    const entry = entries[index];
    if (!entry) return;

    try {
      setSubmitting(true);
      const isUpdate = !!entry.id;
      const url = `${backendUrl}/api/report-entries/${isUpdate ? `${entry.id}/` : ''}`;
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
        data: entry,
      });

      if (!entry.id && response.data?.id) {
        const updatedEntry = { ...entry, id: response.data.id };
        setEntries(prev => {
          const updated = [...prev];
          updated[index] = updatedEntry;
          return updated;
        });
        // Update cache
        entriesCache.current[pagedDate] = entriesCache.current[pagedDate]?.map(e => 
          e === entry ? updatedEntry : e) || [updatedEntry];
      }
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Failed to submit entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, pagedDate]);

  const handleDelete = useCallback(async (index: number) => {
    const entry = entries[index];
    if (!entry) return;

    if (!entry.id) {
      setEntries(prev => prev.filter((_, i) => i !== index));
      return;
    }

    try {
      setSubmitting(true);
      await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
      });

      setEntries(prev => prev.filter((_, i) => i !== index));
      // Update cache
      if (entriesCache.current[pagedDate]) {
        entriesCache.current[pagedDate] = entriesCache.current[pagedDate].filter(e => e.id !== entry.id);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, pagedDate]);

  const handleSubmitAllEntries = useCallback(async () => {
    if (entries.length === 0) {
      alert("No entries to submit for this date.");
      return;
    }

    setSubmitting(true);
    try {
      const requests = entries.map(async (entry, index) => {
        const isUpdate = !!entry.id;
        const url = `${backendUrl}/api/report-entries/${isUpdate ? `${entry.id}/` : ''}`;
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await axios({
          method,
          url,
          headers: { Authorization: `Bearer ${accessTokenRef.current}` },
          data: entry,
        });

        if (!entry.id && response.data?.id) {
          const updatedEntry = { ...entry, id: response.data.id };
          setEntries(prev => {
            const updated = [...prev];
            updated[index] = updatedEntry;
            return updated;
          });
          // Update cache
          entriesCache.current[pagedDate] = entriesCache.current[pagedDate]?.map(e => 
            e === entry ? updatedEntry : e) || [updatedEntry];
        }
      });

      await Promise.all(requests);
    } catch (error) {
      console.error("Error submitting entries:", error);
      alert("Failed to submit some entries.");
    } finally {
      setSubmitting(false);
    }
  }, [entries, pagedDate]);

  return {
    entries,
    isLoading: isLoadingDates || isLoadingEntries,
    isLoadingDates,
    isLoadingEntries,
    submitting,
    currentPage,
    sortedDates: availableDates,
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
  };
};