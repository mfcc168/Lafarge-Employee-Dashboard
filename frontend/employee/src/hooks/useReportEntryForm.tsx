import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { backendUrl } from '@configs/DotEnv';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEntry, createEmptyEntry, fromServer, isBlankEntry, isDirty, toPayload } from '@utils/reportEntryDraft';

const REQUEST_TIMEOUT = 30000;

export const useReportEntryForm = () => {
  const [entries, setEntries] = useState<FormEntry[]>([]);
  const entriesRef = useRef<FormEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [currentPage, updateCurrentPage] = useState(0);
  const { user, accessToken } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const accessTokenRef = useRef(accessToken);
  const inFlightEntriesRef = useRef(new Map<string, Promise<boolean>>());
  const bulkSaveRef = useRef<Promise<void> | null>(null);
  const deletedIdsRef = useRef(new Set<string>());
  const focusedEntryIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  // Event handlers and network completions always use the latest draft, even
  // before React renders. A row's clientId never changes when it gets a DB id.
  const updateEntries = useCallback((update: (current: FormEntry[]) => FormEntry[]) => {
    entriesRef.current = update(entriesRef.current);
    setEntries(entriesRef.current);
  }, []);

  const sortedDates = useMemo(() => {
    const recentDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    return [...new Set([...recentDates, ...entries.map(entry => entry.date)])]
      .sort((a, b) => b.localeCompare(a));
  }, [entries]);
  const pagedDate = sortedDates[currentPage] || today;
  const entriesForCurrentPage = useMemo(() => entries.filter(entry => entry.date === pagedDate), [entries, pagedDate]);

  const { data: allEntriesData = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['report-entries', user?.username],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/report-entries/`, {
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
        timeout: REQUEST_TIMEOUT,
      });
      return response.data as ReportEntry[];
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    const controller = new AbortController();
    const atStart = new Map(entriesRef.current.map(entry => [entry.clientId, entry]));
    setIsLoading(true);
    axios.get<ReportEntry[]>(`${backendUrl}/api/report-entries/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { date: pagedDate },
      timeout: REQUEST_TIMEOUT,
      signal: controller.signal,
    }).then(response => {
      if (cancelled) return;
      updateEntries(current => {
        const local = current.filter(entry => entry.date === pagedDate);
        const merged = response.data
          .filter(entry => !deletedIdsRef.current.has(String(entry.id)))
          .map(entry => {
            const existing = local.find(draft => String(draft.id) === String(entry.id) ||
              (entry.client_request_id && draft.client_request_id === entry.client_request_id));
            if (!existing) return fromServer(entry);
            // Never let a late GET replace a draft changed/saved during the GET.
            if (isDirty(existing) || existing.status !== 'idle' || existing !== atStart.get(existing.clientId)) {
              return existing;
            }
            return fromServer(entry, existing.clientId);
          });
        const keys = new Set(merged.map(entry => entry.clientId));
        for (const draft of local) {
          if (!keys.has(draft.clientId) && (isDirty(draft) || draft.status !== 'idle' || draft !== atStart.get(draft.clientId))) {
            merged.push(draft);
          }
        }
        return [...current.filter(entry => entry.date !== pagedDate), ...merged];
      });
    }).catch(error => {
      if (!cancelled) {
        console.error('Error fetching entries:', error);
        showError('Could Not Load Reports', 'Please check your connection and try again.', 6000);
      }
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [accessToken, pagedDate, updateEntries, showError]);

  // A refresh is background work. Its failure must never hold a save lock or
  // make a successfully persisted report look like a failed submission.
  const refreshReports = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['report-entries'] })
      .catch(error => console.error('Error refreshing report cache:', error));
  }, [queryClient]);

  const addEmptyEntry = useCallback(() => {
    updateEntries(current => {
      const page = current.filter(entry => entry.date === pagedDate);
      if (page.some(entry => !entry.id && isBlankEntry(entry))) return current;
      return [...current, createEmptyEntry(pagedDate)];
    });
  }, [pagedDate, updateEntries]);

  const handleChange = useCallback(<T extends keyof ReportEntry>(clientId: string, field: T, value: ReportEntry[T]) => {
    updateEntries(current => {
      const changed = current.map(entry => entry.clientId === clientId && entry[field] !== value
        ? { ...entry, [field]: value, revision: entry.revision + 1 }
        : entry);
      const entry = changed.find(draft => draft.clientId === clientId);
      if (entry && !isBlankEntry(entry) && !changed.some(draft => draft.date === entry.date && !draft.id && isBlankEntry(draft))) {
        changed.push(createEmptyEntry(entry.date));
      }
      return changed;
    });
  }, [updateEntries]);

  const handleSubmitEntry = useCallback((clientId: string, skipBlankCheck = false, showSuccessMessage = true): Promise<boolean> => {
    // All callers join the actual result. An in-progress save is not a success.
    const existing = inFlightEntriesRef.current.get(clientId);
    if (existing) return existing;
    const initial = entriesRef.current.find(entry => entry.clientId === clientId);
    if (!initial || initial.status === 'deleting') return Promise.resolve(false);
    if (isBlankEntry(initial)) {
      if (!skipBlankCheck) showWarning('Cannot Submit Entry', 'Please fill in at least one field before submitting.', 5000);
      return Promise.resolve(false);
    }
    if (!isDirty(initial)) return Promise.resolve(true);

    // Start in a microtask so the shared promise is registered synchronously,
    // before any request can finish or another save handler can run.
    const operation = Promise.resolve().then(async () => {
      try {
        updateEntries(current => current.map(entry => entry.clientId === clientId ? { ...entry, status: 'saving' } : entry));
        while (true) {
          const snapshot = entriesRef.current.find(entry => entry.clientId === clientId);
          if (!snapshot) return false;
          if (!isDirty(snapshot)) break;
          const response = await axios<ReportEntry>({
            method: snapshot.id ? 'PUT' : 'POST',
            url: snapshot.id ? `${backendUrl}/api/report-entries/${snapshot.id}/` : `${backendUrl}/api/report-entries/`,
            headers: { Authorization: `Bearer ${accessTokenRef.current}` },
            data: toPayload(snapshot),
            timeout: REQUEST_TIMEOUT,
          });
          if (!response.data?.id) throw new Error('The server did not confirm the saved report ID.');
          updateEntries(current => current.map(entry => entry.clientId === clientId ? {
            ...entry,
            id: response.data.id,
            // A 200 POST replays an earlier create whose response was lost.
            // Follow it with a PUT so any edits since that attempt are saved.
            savedRevision: !snapshot.id && response.status === 200 ? snapshot.revision - 1 : snapshot.revision,
          } : entry));
          // If typing continued while this snapshot was saving, persist the
          // latest revision next, using PUT and the returned database ID.
        }
        updateEntries(current => current.map(entry => entry.clientId === clientId ? { ...entry, status: 'idle' } : entry));
        refreshReports();
        if (showSuccessMessage) showSuccess(initial.id ? 'Report Updated' : 'Report Saved', 'Your report entry has been saved successfully.', 3000);
        return true;
      } catch (error) {
        console.error('Error submitting entry:', error);
        updateEntries(current => current.map(entry => entry.clientId === clientId ? { ...entry, status: 'error' } : entry));
        showError('Submission Failed', 'Your changes are still in this form. Check your connection and use Save or Save All to retry.', 6000);
        return false;
      } finally {
        inFlightEntriesRef.current.delete(clientId);
      }
    });
    inFlightEntriesRef.current.set(clientId, operation);
    return operation;
  }, [updateEntries, refreshReports, showSuccess, showError, showWarning]);

  const saveIfDirty = useCallback((clientId: string | null) => {
    const entry = entriesRef.current.find(draft => draft.clientId === clientId);
    if (entry && isDirty(entry) && !isBlankEntry(entry)) void handleSubmitEntry(entry.clientId, true, false);
  }, [handleSubmitEntry]);

  const handleFocus = useCallback((clientId: string) => {
    const previous = focusedEntryIdRef.current;
    // Update immediately: a slow save must not delay tracking the next row.
    focusedEntryIdRef.current = clientId;
    if (previous !== clientId) saveIfDirty(previous);
  }, [saveIfDirty]);

  const setCurrentPage = useCallback((page: number) => {
    saveIfDirty(focusedEntryIdRef.current);
    focusedEntryIdRef.current = null;
    updateCurrentPage(page);
  }, [saveIfDirty]);

  const handleDelete = useCallback(async (clientId: string) => {
    const entry = entriesRef.current.find(draft => draft.clientId === clientId);
    if (!entry || entry.status === 'deleting' || inFlightEntriesRef.current.has(clientId)) return;
    if (!entry.id) {
      updateEntries(current => current.filter(draft => draft.clientId !== clientId));
      return;
    }
    updateEntries(current => current.map(draft => draft.clientId === clientId ? { ...draft, status: 'deleting' } : draft));
    try {
      await axios.delete(`${backendUrl}/api/report-entries/${entry.id}/`, {
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
        timeout: REQUEST_TIMEOUT,
      });
      deletedIdsRef.current.add(String(entry.id));
      updateEntries(current => current.filter(draft => draft.clientId !== clientId));
      refreshReports();
    } catch (error) {
      console.error('Error deleting entry:', error);
      updateEntries(current => current.map(draft => draft.clientId === clientId ? { ...draft, status: entry.status } : draft));
      showError('Deletion Failed', 'Failed to delete entry. Please check your connection and try again.', 6000);
    }
  }, [updateEntries, refreshReports, showError]);

  const handleSubmitAllEntries = useCallback((): Promise<void> => {
    if (bulkSaveRef.current) return bulkSaveRef.current;
    const nonBlank = entriesRef.current.filter(entry => entry.date === pagedDate && !isBlankEntry(entry));
    if (!nonBlank.length) {
      showWarning('No Data to Submit', 'All entries on this page are blank. Please fill in at least one field.', 5000);
      return Promise.resolve();
    }
    setSavingAll(true);
    const operation = Promise.resolve().then(async () => {
      try {
        const results = await Promise.all(nonBlank.map(entry => handleSubmitEntry(entry.clientId, true, false)));
        const savedCount = results.filter(Boolean).length;
        const failedCount = results.length - savedCount;
        if (savedCount > 0) showSuccess('Reports Saved', `${savedCount} report entr${savedCount === 1 ? 'y was' : 'ies were'} saved successfully.`, 3500);
        if (failedCount > 0) showWarning('Some Reports Were Not Saved', `${failedCount} report entr${failedCount === 1 ? 'y' : 'ies'} could not be saved. Please try again.`, 6000);
      } finally {
        bulkSaveRef.current = null;
        setSavingAll(false);
      }
    });
    bulkSaveRef.current = operation;
    return operation;
  }, [pagedDate, handleSubmitEntry, showSuccess, showWarning]);

  const getUniqueSuggestions = useCallback((field: keyof ReportEntry): string[] => {
    const values = allEntriesData.map(entry => entry[field])
      .filter(value => typeof value === 'string' && value.trim() !== '') as string[];
    return [...new Set(values)];
  }, [allEntriesData]);
  const timeRangeSuggestions = useMemo(() => getUniqueSuggestions('time_range'), [getUniqueSuggestions]);
  const doctorNameSuggestions = useMemo(() => getUniqueSuggestions('doctor_name'), [getUniqueSuggestions]);
  const districtSuggestions = useMemo(() => getUniqueSuggestions('district'), [getUniqueSuggestions]);

  return {
    entries: entriesForCurrentPage, isLoading, isLoadingSuggestions, savingAll,
    currentPage, sortedDates, pagedDate, focusedEntryIdRef,
    timeRangeSuggestions, doctorNameSuggestions, districtSuggestions,
    addEmptyEntry, handleChange, handleFocus, handleSubmitEntry, handleSubmitAllEntries,
    handleDelete, setCurrentPage, totalPages: sortedDates.length,
  };
};
