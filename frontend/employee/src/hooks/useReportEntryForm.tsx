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

  const accessTokenRef = useRef(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);
  
  const fetchEntries = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) return;
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
  }, []);

  useEffect(() => {
    fetchEntries();
  }, []);


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

    setEntries(prevEntries => {
      const updated = [...prevEntries, newEntry];
      return updated;
    });

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


    if (!entry.id && response.data?.id) {
      const updatedEntry = { ...entry, id: response.data.id };
      setEntries(prevEntries => {
        const updatedEntries = [...prevEntries];
        updatedEntries[globalIndex] = updatedEntry;
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

const handleSubmitAllEntries = useCallback(async () => {
if (entriesForCurrentPage.length === 0) {
alert("No entries to submit on this page.");
return;
}

setSubmitting(true);

try {
const requests = entriesForCurrentPage.map(async (entry, index) => {
  const globalIndex = getGlobalIndex(index);
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
      updatedEntries[globalIndex] = updatedEntry;
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
}, [entriesForCurrentPage, getGlobalIndex]);


const getUniqueSuggestions = useCallback((field: keyof ReportEntry): string[] => {
const values = entries
  .map(entry => entry[field])
  .filter(v => typeof v === 'string' && v.trim() !== '') as string[];
return Array.from(new Set(values));
}, [entries]);

const getTelOrderSuggestions = (doctorName: string): string[] => {
const matchingEntries = entries.filter(entry => entry.doctor_name === doctorName && entry.doctor_name !== null);
const telOrders = matchingEntries
  .map(entry => entry.tel_orders.trim())
  .filter(order => order !== '');

return Array.from(new Set(telOrders)); // remove duplicates
};


const timeRangeSuggestions = useMemo(() => getUniqueSuggestions('time_range'), [getUniqueSuggestions]);
const doctorNameSuggestions = useMemo(() => getUniqueSuggestions('doctor_name'), [getUniqueSuggestions]);
const districtSuggestions = useMemo(() => getUniqueSuggestions('district'), [getUniqueSuggestions]);


  return {
    entries: entriesForCurrentPage,
    isLoading,
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
}