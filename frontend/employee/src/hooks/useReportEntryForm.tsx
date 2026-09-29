import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { backendUrl } from '@configs/DotEnv';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type LocalReportEntry = ReportEntry & {
  clientId: string;
};

type ReportSuggestions = {
  time_ranges: string[];
  doctor_names: string[];
  districts: string[];
};

type EntryStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'deleting';

const EMPTY_SUGGESTIONS: ReportSuggestions = {
  time_ranges: [],
  doctor_names: [],
  districts: [],
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createClientId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const withClientId = (entry: ReportEntry): LocalReportEntry => ({
  ...entry,
  clientId: entry.id ? `server-${entry.id}` : createClientId(),
});

const toReportPayload = (entry: LocalReportEntry) => ({
  date: entry.date,
  time_range: entry.time_range,
  doctor_name: entry.doctor_name,
  district: entry.district,
  client_type: entry.client_type,
  new_client: entry.new_client,
  orders: entry.orders,
  samples: entry.samples,
  tel_orders: entry.tel_orders,
  new_product_intro: entry.new_product_intro,
  old_product_followup: entry.old_product_followup,
  delivery_time_update: entry.delivery_time_update,
});

const uniqueNonEmpty = (values: string[]) =>
  Array.from(new Set(values.filter((value) => value?.trim())));

export const useReportEntryForm = () => {
  const [entries, setEntries] = useState<LocalReportEntry[]>([]);
  const [newestEntryIndex, setNewestEntryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [savingEntryIds, setSavingEntryIds] = useState<Set<string>>(new Set());
  const [deletingEntryIds, setDeletingEntryIds] = useState<Set<string>>(new Set());
  const [dirtyEntryIds, setDirtyEntryIds] = useState<Set<string>>(new Set());
  const [savedEntryIds, setSavedEntryIds] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);

  const { user, accessToken } = useAuth();
  const { showError, showWarning } = useToast();
  const today = formatLocalDate(new Date());

  const accessTokenRef = useRef(accessToken);
  const fetchRequestIdRef = useRef(0);
  const savingEntryIdsRef = useRef<Set<string>>(new Set());
  const dirtyEntriesRef = useRef<Map<string, LocalReportEntry>>(new Map());
  const entryRevisionRef = useRef<Map<string, number>>(new Map());
  const queryClient = useQueryClient();

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const groupedEntriesByDate = useMemo(() => {
    const groups: { [date: string]: LocalReportEntry[] } = {};
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
      return formatLocalDate(date);
    });

    const allDates = new Set([
      ...recentDates,
      ...Object.keys(groupedEntriesByDate),
    ]);

    return Array.from(allDates).sort((a, b) => b.localeCompare(a));
  }, [groupedEntriesByDate]);

  const pagedDate = sortedDates[currentPage] || today;

  const entriesForCurrentPage = useMemo(
    () => groupedEntriesByDate[pagedDate] || [],
    [groupedEntriesByDate, pagedDate]
  );

  const {
    data: suggestionsData = EMPTY_SUGGESTIONS,
    isLoading: isLoadingSuggestions,
  } = useQuery<ReportSuggestions>({
    queryKey: ['report-entry-suggestions', user?.username],
    queryFn: async () => {
      if (!accessToken) throw new Error('No token');
      const response = await axios.get(
        `${backendUrl}/api/report-entry-suggestions/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data as ReportSuggestions;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const markReportDataStale = useCallback(() => {
    // Mark report data stale without refetching right now. The report editor
    // already has the authoritative mutation response, so making the user wait
    // for extra GETs only slows the interaction down.
    void queryClient.invalidateQueries({
      queryKey: ['report-entries'],
      refetchType: 'none',
    });
  }, [queryClient]);

  const updateSuggestionsFromEntry = useCallback((entry: ReportEntry) => {
    queryClient.setQueryData<ReportSuggestions>(
      ['report-entry-suggestions', user?.username],
      (current = EMPTY_SUGGESTIONS) => ({
        time_ranges: uniqueNonEmpty([...current.time_ranges, entry.time_range]),
        doctor_names: uniqueNonEmpty([...current.doctor_names, entry.doctor_name]),
        districts: uniqueNonEmpty([...current.districts, entry.district]),
      })
    );
  }, [queryClient, user?.username]);

  const setEntrySaving = useCallback((clientId: string, saving: boolean) => {
    if (saving) {
      savingEntryIdsRef.current.add(clientId);
      setSavingEntryIds((current) => {
        const next = new Set(current);
        next.add(clientId);
        return next;
      });
      return;
    }

    savingEntryIdsRef.current.delete(clientId);
    setSavingEntryIds((current) => {
      const next = new Set(current);
      next.delete(clientId);
      return next;
    });
  }, []);

  const markEntryClean = useCallback((clientId: string) => {
    dirtyEntriesRef.current.delete(clientId);
    setDirtyEntryIds((current) => {
      const next = new Set(current);
      next.delete(clientId);
      return next;
    });
  }, []);

  const flashEntrySaved = useCallback((clientId: string) => {
    setSavedEntryIds((current) => {
      const next = new Set(current);
      next.add(clientId);
      return next;
    });

    window.setTimeout(() => {
      setSavedEntryIds((current) => {
        const next = new Set(current);
        next.delete(clientId);
        return next;
      });
    }, 1400);
  }, []);

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
        params: { date },
      });

      if (requestId !== fetchRequestIdRef.current) return;

      const serverEntries = (response.data as ReportEntry[]).map(withClientId);
      const dirtyForDate = Array.from(dirtyEntriesRef.current.values()).filter(
        (entry) => entry.date === date
      );
      const dirtyByServerId = new Map(
        dirtyForDate
          .filter((entry) => entry.id)
          .map((entry) => [String(entry.id), entry])
      );

      const mergedServerEntries = serverEntries.map(
        (entry) => dirtyByServerId.get(String(entry.id)) || entry
      );
      const unsavedDrafts = dirtyForDate.filter((entry) => !entry.id);

      setEntries([...mergedServerEntries, ...unsavedDrafts]);
      setNewestEntryIndex(null);
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

  useEffect(() => {
    fetchEntries(pagedDate);
  }, [pagedDate, fetchEntries]);

  const addEmptyEntry = useCallback(() => {
    const newEntry: LocalReportEntry = {
      clientId: createClientId(),
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

    setEntries((current) => [...current, newEntry]);
    setNewestEntryIndex(entriesForCurrentPage.length);

    if (!sortedDates.includes(pagedDate)) {
      setCurrentPage(0);
    }
  }, [pagedDate, sortedDates, entriesForCurrentPage.length]);

  const handleChange = useCallback(<T extends keyof ReportEntry>(
    index: number,
    field: T,
    value: ReportEntry[T]
  ) => {
    const entry = entriesForCurrentPage[index];
    if (!entry) return;

    const updatedEntry: LocalReportEntry = {
      ...entry,
      [field]: value,
    };

    setEntries((current) =>
      current.map((candidate) =>
        candidate.clientId === entry.clientId ? updatedEntry : candidate
      )
    );

    dirtyEntriesRef.current.set(entry.clientId, updatedEntry);
    entryRevisionRef.current.set(
      entry.clientId,
      (entryRevisionRef.current.get(entry.clientId) || 0) + 1
    );

    setDirtyEntryIds((current) => {
      const next = new Set(current);
      next.add(entry.clientId);
      return next;
    });

    setSavedEntryIds((current) => {
      if (!current.has(entry.clientId)) return current;
      const next = new Set(current);
      next.delete(entry.clientId);
      return next;
    });
  }, [entriesForCurrentPage]);

  const isBlankEntry = useCallback((entry: ReportEntry) => (
    !entry.time_range?.trim() &&
    !entry.doctor_name?.trim() &&
    !entry.district?.trim() &&
    !entry.orders?.trim() &&
    !entry.samples?.trim() &&
    !entry.tel_orders?.trim() &&
    !entry.new_product_intro?.trim() &&
    !entry.old_product_followup?.trim() &&
    !entry.delivery_time_update?.trim()
  ), []);

  const handleSubmitEntry = useCallback(async (
    index: number,
    skipBlankCheck = false,
    invalidateCache = true
  ) => {
    const entry = entriesForCurrentPage[index];
    if (!entry) return false;

    if (!skipBlankCheck && isBlankEntry(entry)) {
      showWarning(
        'Cannot Submit Entry',
        'Please fill in at least one field before submitting.',
        5000
      );
      return false;
    }

    if (savingEntryIdsRef.current.has(entry.clientId)) {
      return true;
    }

    const revisionAtStart = entryRevisionRef.current.get(entry.clientId) || 0;
    setEntrySaving(entry.clientId, true);

    try {
      const isUpdate = !!entry.id;
      const url = isUpdate
        ? `${backendUrl}/api/report-entries/${entry.id}/`
        : `${backendUrl}/api/report-entries/`;
      const method = isUpdate ? 'PATCH' : 'POST';

      const response = await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        data: toReportPayload(entry),
      });

      const serverEntry = response.data as ReportEntry;
      const latestRevision = entryRevisionRef.current.get(entry.clientId) || 0;

      if (latestRevision === revisionAtStart) {
        const savedEntry: LocalReportEntry = {
          ...serverEntry,
          clientId: entry.clientId,
        };

        setEntries((current) =>
          current.map((candidate) =>
            candidate.clientId === entry.clientId ? savedEntry : candidate
          )
        );
        markEntryClean(entry.clientId);
        flashEntrySaved(entry.clientId);
      } else {
        // The user kept typing while the request was in flight. Preserve those
        // newer edits but attach the server ID returned by the first create.
        const latestDraft = dirtyEntriesRef.current.get(entry.clientId) || entry;
        const mergedEntry: LocalReportEntry = {
          ...serverEntry,
          ...latestDraft,
          id: serverEntry.id,
          salesman_name: serverEntry.salesman_name || latestDraft.salesman_name,
          clientId: entry.clientId,
        };

        dirtyEntriesRef.current.set(entry.clientId, mergedEntry);
        setEntries((current) =>
          current.map((candidate) =>
            candidate.clientId === entry.clientId ? mergedEntry : candidate
          )
        );
      }

      updateSuggestionsFromEntry(serverEntry);

      if (invalidateCache) {
        markReportDataStale();
      }

      return true;
    } catch (error) {
      console.error('Error submitting entry:', error);
      showError(
        'Submission Failed',
        'Failed to submit entry. Your changes are still on screen so you can retry.',
        6000
      );
      return false;
    } finally {
      setEntrySaving(entry.clientId, false);
    }
  }, [
    entriesForCurrentPage,
    isBlankEntry,
    markEntryClean,
    flashEntrySaved,
    markReportDataStale,
    setEntrySaving,
    showError,
    showWarning,
    updateSuggestionsFromEntry,
  ]);

  const handleDelete = useCallback(async (index: number) => {
    const entry = entriesForCurrentPage[index];
    if (!entry) return;

    if (savingEntryIdsRef.current.has(entry.clientId)) {
      return;
    }

    const originalIndex = entries.findIndex(
      (candidate) => candidate.clientId === entry.clientId
    );
    const wasDirty = dirtyEntriesRef.current.has(entry.clientId);

    // Optimistic delete: remove the row immediately and put it back only if
    // the API request fails.
    setEntries((current) =>
      current.filter((candidate) => candidate.clientId !== entry.clientId)
    );
    dirtyEntriesRef.current.delete(entry.clientId);
    setDirtyEntryIds((current) => {
      const next = new Set(current);
      next.delete(entry.clientId);
      return next;
    });
    setSavedEntryIds((current) => {
      const next = new Set(current);
      next.delete(entry.clientId);
      return next;
    });

    if (!entry.id) {
      return;
    }

    setDeletingEntryIds((current) => {
      const next = new Set(current);
      next.add(entry.clientId);
      return next;
    });

    try {
      await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
      });

      markReportDataStale();
    } catch (error) {
      console.error('Error deleting entry:', error);

      setEntries((current) => {
        const restored = [...current];
        restored.splice(Math.max(0, originalIndex), 0, entry);
        return restored;
      });

      if (wasDirty) {
        dirtyEntriesRef.current.set(entry.clientId, entry);
        setDirtyEntryIds((current) => {
          const next = new Set(current);
          next.add(entry.clientId);
          return next;
        });
      }

      showError(
        'Deletion Failed',
        'The entry was restored because the server could not delete it.',
        6000
      );
    } finally {
      setDeletingEntryIds((current) => {
        const next = new Set(current);
        next.delete(entry.clientId);
        return next;
      });
    }
  }, [entries, entriesForCurrentPage, markReportDataStale, showError]);

  const handleSubmitAllEntries = useCallback(async () => {
    const changedEntries = entriesForCurrentPage
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) =>
        dirtyEntryIds.has(entry.clientId) && !isBlankEntry(entry)
      );

    if (changedEntries.length === 0) {
      showWarning(
        'Everything is Saved',
        'There are no unsaved report changes on this page.',
        3000
      );
      return;
    }

    setIsSavingAll(true);

    try {
      const results = await Promise.all(
        changedEntries.map(({ index }) =>
          handleSubmitEntry(index, true, false)
        )
      );

      markReportDataStale();

      if (results.some((result) => result === false)) {
        showError(
          'Some Changes Were Not Saved',
          'Successful entries were kept. Entries that failed remain marked as unsaved so you can retry.',
          6000
        );
      }
    } finally {
      setIsSavingAll(false);
    }
  }, [
    dirtyEntryIds,
    entriesForCurrentPage,
    handleSubmitEntry,
    isBlankEntry,
    markReportDataStale,
    showError,
    showWarning,
  ]);

  const timeRangeSuggestions = useMemo(
    () => uniqueNonEmpty([
      ...suggestionsData.time_ranges,
      ...entries.map((entry) => entry.time_range),
    ]),
    [suggestionsData.time_ranges, entries]
  );

  const doctorNameSuggestions = useMemo(
    () => uniqueNonEmpty([
      ...suggestionsData.doctor_names,
      ...entries.map((entry) => entry.doctor_name),
    ]),
    [suggestionsData.doctor_names, entries]
  );

  const districtSuggestions = useMemo(
    () => uniqueNonEmpty([
      ...suggestionsData.districts,
      ...entries.map((entry) => entry.district),
    ]),
    [suggestionsData.districts, entries]
  );

  const getTelOrderSuggestions = useCallback((doctorName: string): string[] => (
    uniqueNonEmpty(
      entries
        .filter((entry) => entry.doctor_name === doctorName)
        .map((entry) => entry.tel_orders)
    )
  ), [entries]);

  const getEntryStatus = useCallback((index: number): EntryStatus => {
    const entry = entriesForCurrentPage[index];
    if (!entry) return 'idle';

    if (deletingEntryIds.has(entry.clientId)) return 'deleting';
    if (savingEntryIds.has(entry.clientId)) return 'saving';
    if (dirtyEntryIds.has(entry.clientId)) return 'dirty';
    if (savedEntryIds.has(entry.clientId)) return 'saved';
    return 'idle';
  }, [
    deletingEntryIds,
    dirtyEntryIds,
    entriesForCurrentPage,
    savedEntryIds,
    savingEntryIds,
  ]);

  return {
    entries: entriesForCurrentPage,
    newestEntryIndex,
    isLoading,
    isLoadingSuggestions,
    submitting: isSavingAll || savingEntryIds.size > 0 || deletingEntryIds.size > 0,
    isSavingAll,
    currentPage,
    sortedDates,
    pagedDate,
    timeRangeSuggestions,
    doctorNameSuggestions,
    districtSuggestions,
    getTelOrderSuggestions,
    getEntryStatus,
    addEmptyEntry,
    handleChange,
    handleSubmitAllEntries,
    handleSubmitEntry,
    handleDelete,
    setCurrentPage,
    totalPages: sortedDates.length,
  };
};
