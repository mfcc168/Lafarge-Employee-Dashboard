import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { backendUrl } from '@configs/DotEnv';

export const useReportEntryForm = () => {
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const { accessToken, user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const accessTokenRef = useRef(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Fetch available dates with entries
  const fetchAvailableDates = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/report-entry-dates/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const dates = response.data.map((date: string) => date.split('T')[0]);
      
      // Include recent 7 days even if they have no entries
      const recentDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });

      const allDates = new Set([...recentDates, ...dates]);
      const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
      
      setAvailableDates(sortedDates);
      
      // Set current page to today's date if it exists
      const todayIndex = sortedDates.indexOf(today);
      if (todayIndex !== -1) {
        setCurrentPage(todayIndex);
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
    }
  }, [accessToken, today]);

  // Fetch entries for a specific date
  const fetchEntries = useCallback(async (date: string) => {
    const token = accessTokenRef.current;
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/all-report-entries/`, {
        params: { date },
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
  }, []);

  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);

  useEffect(() => {
    if (availableDates.length > 0 && currentPage < availableDates.length) {
      fetchEntries(availableDates[currentPage]);
    }
  }, [currentPage, availableDates, fetchEntries]);

  const pagedDate = availableDates[currentPage] || today;

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

    setEntries(prevEntries => [...prevEntries, newEntry]);
  }, [pagedDate, user?.username]);


  const handleChange = useCallback(<T extends keyof ReportEntry>(
    index: number,
    field: T,
    value: ReportEntry[T]
  ) => {
    setEntries(prevEntries => {
      const updatedEntries = [...prevEntries];
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      };
      return updatedEntries;
    });
  }, []);

  const handleSubmitEntry = useCallback(async (index: number) => {
    const entry = entries[index];
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

      if (!entry.id && response.data?.id) {
        const updatedEntry = { ...entry, id: response.data.id };
        setEntries(prevEntries => {
          const updatedEntries = [...prevEntries];
          updatedEntries[index] = updatedEntry;
          return updatedEntries;
        });
      }
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Failed to submit entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, accessToken]);

  const handleDelete = useCallback(async (index: number) => {
    const entry = entries[index];
    if (!entry) return;

    if (!entry.id) {
      setEntries(prevEntries => prevEntries.filter((_, i) => i !== index));
      return;
    }

    try {
      setSubmitting(true);
      await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setEntries(prevEntries => prevEntries.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [entries, accessToken]);

  const handleSubmitAllEntries = useCallback(async () => {
    if (entries.length === 0) {
      alert("No entries to submit for this date.");
      return;
    }

    setSubmitting(true);

    try {
      const requests = entries.map(async (entry, index) => {
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
          setEntries(prevEntries => {
            const updatedEntries = [...prevEntries];
            updatedEntries[index] = updatedEntry;
            return updatedEntries;
          });
        }
      });

      await Promise.all(requests);
    } catch (error) {
      console.error("Error submitting entries:", error);
      alert("Failed to submit some entries.");
    } finally {
      setSubmitting(false);
    }
  }, [entries]);

  const getUniqueSuggestions = useCallback((field: keyof ReportEntry): string[] => {
    const values = entries
      .map(entry => entry[field])
      .filter(v => typeof v === 'string' && v.trim() !== '') as string[];
    return Array.from(new Set(values));
  }, [entries]);

  const getTelOrderSuggestions = (doctorName: string): string[] => {
    const matchingEntries = entries.filter(entry => entry.doctor_name === doctorName);
    const telOrders = matchingEntries
      .map(entry => entry.tel_orders.trim())
      .filter(order => order !== '');

    return Array.from(new Set(telOrders));
  };

  const timeRangeSuggestions = useMemo(() => getUniqueSuggestions('time_range'), [getUniqueSuggestions]);
  const doctorNameSuggestions = useMemo(() => getUniqueSuggestions('doctor_name'), [getUniqueSuggestions]);
  const districtSuggestions = useMemo(() => getUniqueSuggestions('district'), [getUniqueSuggestions]);

  return {
    entries,
    isLoading,
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
    totalPages: availableDates.length,
  };
};