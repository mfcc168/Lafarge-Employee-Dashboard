import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReportEntry } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { backendUrl } from '@configs/DotEnv';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { emptyReportSuggestions, reportKeys, syncReportCaches, type ReportSuggestions } from '@utils/reportCache';
import { ReportDraftStorage } from '@utils/reportDraftStorage';
import { FormEntry, createEmptyEntry, fromServer, isBlankEntry, isDirty, toPayload } from '@utils/reportEntryDraft';

const REQUEST_TIMEOUT = 30000;
const AUTOSAVE_DELAY = 1000;

type BulkSaveBatch = {
  promise: Promise<void>;
  requests: Map<string, Promise<boolean>>;
};

export const useReportEntryForm = () => {
  const [entries, setEntries] = useState<FormEntry[]>([]);
  const entriesRef = useRef<FormEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingDates, setSavingDates] = useState<Set<string>>(new Set());
  const [currentPage, updateCurrentPage] = useState(0);
  const { user, accessToken } = useAuth();
  const draftStorage = useMemo(() => user?.username ? new ReportDraftStorage(backendUrl, user.username) : null, [user?.username]);
  const [draftStorageError, setDraftStorageError] = useState(false);
  const autosaveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const composingIdsRef = useRef(new Set<string>());
  const autosaveRef = useRef<(clientId: string) => void>(() => undefined);
  const activeEditorRef = useRef(true);
  const { showSuccess, showError, showWarning } = useToast();
  const accessTokenRef = useRef(accessToken);
  const inFlightEntriesRef = useRef(new Map<string, Promise<boolean>>());
  const bulkSavesRef = useRef(new Map<string, BulkSaveBatch>());
  const deletedIdsRef = useRef(new Set<string>());
  const focusedEntryIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  // Event handlers and network completions always use the latest draft, even
  // before React renders. A row's clientId never changes when it gets a DB id.
  const updateEntries = useCallback((update: (current: FormEntry[]) => FormEntry[], editedId?: string) => {
    entriesRef.current = update(entriesRef.current);
    let locallyStored = new Set<string>();
    if (draftStorage) {
      try {
        // Persist before returning to the browser, not in a delayed effect or
        // unload handler. Network failures and reloads retain the latest text.
        locallyStored = draftStorage.sync(entriesRef.current, editedId);
        setDraftStorageError(false);
      } catch (error) {
        console.error('Could not store report drafts:', error);
        setDraftStorageError(true);
      }
    }
    entriesRef.current = entriesRef.current.map(entry => {
      const localDraftSaved = locallyStored.has(entry.clientId);
      return !!entry.localDraftSaved === localDraftSaved ? entry : { ...entry, localDraftSaved };
    });
    setEntries(entriesRef.current);
  }, [draftStorage]);

  useEffect(() => {
    if (!draftStorage) return;
    try {
      const recovered = draftStorage.read();
      updateEntries(current => {
        const merged = [...current];
        for (const draft of recovered) {
          const index = merged.findIndex(entry => entry.clientId === draft.clientId ||
            (entry.id && String(entry.id) === String(draft.id)));
          if (index < 0) merged.push(draft);
          else if (!isDirty(merged[index])) merged[index] = draft;
        }
        return merged;
      });
    } catch (error) {
      console.error('Could not recover report drafts:', error);
      setDraftStorageError(true);
    }
  }, [draftStorage, updateEntries]);

  const cancelAutosave = useCallback((clientId: string) => {
    clearTimeout(autosaveTimersRef.current.get(clientId));
    autosaveTimersRef.current.delete(clientId);
  }, []);

  const scheduleAutosave = useCallback((clientId: string) => {
    cancelAutosave(clientId);
    const entry = entriesRef.current.find(draft => draft.clientId === clientId);
    if (!entry || !isDirty(entry) || (!entry.id && isBlankEntry(entry)) || composingIdsRef.current.has(clientId)) return;
    autosaveTimersRef.current.set(clientId, setTimeout(() => {
      autosaveTimersRef.current.delete(clientId);
      autosaveRef.current(clientId);
    }, AUTOSAVE_DELAY));
  }, [cancelAutosave]);

  useEffect(() => {
    activeEditorRef.current = true;
    const timers = autosaveTimersRef.current;
    return () => {
      activeEditorRef.current = false;
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
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
  const savingAll = savingDates.has(pagedDate);
  const entriesForCurrentPage = useMemo(() => entries.filter(entry => entry.date === pagedDate), [entries, pagedDate]);

  const { data: suggestions = emptyReportSuggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: reportKeys.suggestions(user?.username),
    queryFn: async ({ signal }) => {
      const response = await axios.get<ReportSuggestions>(`${backendUrl}/api/report-entries/suggestions/`, {
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
        timeout: REQUEST_TIMEOUT,
        signal,
      });
      return response.data;
    },
    enabled: !!accessToken && !!user?.username,
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

  const publishReport = useCallback((entry: ReportEntry, deleted = false) => {
    // Cache synchronization must never turn an acknowledged write into a
    // failed save, even if an optional background refresh fails.
    try {
      if (!activeEditorRef.current) {
        // A newly opened editor may already have saved a newer revision. Read
        // the current server state instead of publishing this older snapshot.
        for (const queryKey of [['reports', user?.username], reportKeys.suggestions(user?.username)]) {
          void queryClient.cancelQueries({ queryKey })
            .then(() => queryClient.invalidateQueries({ queryKey }))
            .catch(error => console.error('Error refreshing reports after navigation:', error));
        }
        return;
      }
      syncReportCaches(queryClient, user?.username, entry, deleted);
    } catch (error) {
      console.error('Error synchronizing report cache:', error);
    }
  }, [queryClient, user?.username]);

  const addEmptyEntry = useCallback(() => {
    updateEntries(current => {
      const page = current.filter(entry => entry.date === pagedDate);
      if (page.some(entry => !entry.id && isBlankEntry(entry))) return current;
      return [...current, createEmptyEntry(pagedDate)];
    });
  }, [pagedDate, updateEntries]);

  const handleChange = useCallback(<T extends keyof ReportEntry>(clientId: string, field: T, value: ReportEntry[T]) => {
    if (entriesRef.current.find(entry => entry.clientId === clientId)?.[field] === value) return;
    updateEntries(current => {
      const changed = current.map(entry => entry.clientId === clientId && entry[field] !== value
        ? { ...entry, [field]: value, revision: entry.revision + 1, recovered: false, status: entry.status === 'error' ? 'idle' : entry.status }
        : entry);
      const entry = changed.find(draft => draft.clientId === clientId);
      if (entry && !isBlankEntry(entry) && !changed.some(draft => draft.date === entry.date && !draft.id && isBlankEntry(draft))) {
        changed.push(createEmptyEntry(entry.date));
      }
      return changed;
    }, clientId);
    scheduleAutosave(clientId);
  }, [updateEntries, scheduleAutosave]);

  const handleSubmitEntry = useCallback((clientId: string, skipBlankCheck = false, showSuccessMessage = true, source: 'auto' | 'manual' = 'manual'): Promise<boolean> => {
    cancelAutosave(clientId);
    // All callers join the actual result. An in-progress save is not a success.
    const existing = inFlightEntriesRef.current.get(clientId);
    if (existing) {
      if (source === 'manual') updateEntries(current => current.map(entry => entry.clientId === clientId
        ? { ...entry, saveSource: 'manual' } : entry));
      return existing;
    }
    const initial = entriesRef.current.find(entry => entry.clientId === clientId);
    if (!initial) return Promise.resolve(false);
    if (initial.status === 'deleting') {
      if (showSuccessMessage) showWarning('Report Is Being Deleted', 'This report is being deleted. You can save it again if deletion fails.', 5000);
      return Promise.resolve(false);
    }
    if (!initial.id && isBlankEntry(initial)) {
      if (!skipBlankCheck) showWarning('Cannot Submit Entry', 'Please fill in at least one field before submitting.', 5000);
      return Promise.resolve(false);
    }
    if (!isDirty(initial)) {
      if (showSuccessMessage) showSuccess('Report Saved', 'This report entry is already saved.', 3000);
      return Promise.resolve(true);
    }

    // Acknowledge the click immediately without changing/disabling the button.
    // "Saved" is reserved for a confirmed response; pending inputs stay editable.
    updateEntries(current => current.map(entry => entry.clientId === clientId
      ? { ...entry, status: 'saving', saveSource: source, recovered: false } : entry));

    // Start in a microtask so the shared promise is registered synchronously,
    // before any request can finish or another save handler can run.
    const operation = Promise.resolve().then(async () => {
      try {
        let firstRequest = true;
        while (true) {
          const snapshot = entriesRef.current.find(entry => entry.clientId === clientId);
          if (!snapshot) return false;
          if (!isDirty(snapshot)) break;
          // After navigation, keep queued edits as recoverable drafts. An old
          // editor must not send a follow-up PUT over a newly recovered edit.
          if (!activeEditorRef.current && !firstRequest) return false;
          firstRequest = false;
          const response = await axios<ReportEntry>({
            method: snapshot.id ? 'PUT' : 'POST',
            url: snapshot.id ? `${backendUrl}/api/report-entries/${snapshot.id}/` : `${backendUrl}/api/report-entries/`,
            headers: { Authorization: `Bearer ${accessTokenRef.current}` },
            data: toPayload(snapshot),
            timeout: REQUEST_TIMEOUT,
          });
          if (!response.data?.id) throw new Error('The server did not confirm the saved report ID.');
          const replay = !snapshot.id && response.status === 200;
          const saved = { ...toPayload(snapshot), ...response.data };
          updateEntries(current => current.map(entry => entry.clientId === clientId ? {
            ...entry,
            // Apply canonical server values only if no newer typing exists.
            // A replay is an old snapshot and must be followed by a PUT.
            ...(entry.revision === snapshot.revision && !replay ? saved : {}),
            id: response.data.id,
            savedRevision: replay ? snapshot.revision - 1 : snapshot.revision,
          } : entry));
          publishReport(saved);
          // If typing continued while this snapshot was saving, persist the
          // latest revision next, using PUT and the returned database ID.
        }
        updateEntries(current => current.map(entry => entry.clientId === clientId ? { ...entry, status: 'idle' } : entry));
        if (showSuccessMessage && activeEditorRef.current) showSuccess(initial.id ? 'Report Updated' : 'Report Saved', 'Your report entry has been saved successfully.', 3000);
        return true;
      } catch (error) {
        console.error('Error submitting entry:', error);
        updateEntries(current => current.map(entry => entry.clientId === clientId ? { ...entry, status: 'error' } : entry));
        showError('Submission Failed', 'Your changes are still in this form. Check your connection and use Save All to retry.', 6000);
        return false;
      } finally {
        inFlightEntriesRef.current.delete(clientId);
      }
    });
    inFlightEntriesRef.current.set(clientId, operation);
    // A manual retry also replaces the failed result in any ongoing Save All.
    for (const batch of bulkSavesRef.current.values()) {
      if (batch.requests.has(clientId)) batch.requests.set(clientId, operation);
    }
    return operation;
  }, [cancelAutosave, updateEntries, publishReport, showSuccess, showError, showWarning]);

  const saveIfDirty = useCallback((clientId: string | null) => {
    const entry = entriesRef.current.find(draft => draft.clientId === clientId);
    if (entry && !entry.recovered && !composingIdsRef.current.has(entry.clientId) &&
      isDirty(entry) && (entry.id || !isBlankEntry(entry))) void handleSubmitEntry(entry.clientId, true, false, 'auto');
  }, [handleSubmitEntry]);

  useEffect(() => { autosaveRef.current = saveIfDirty; }, [saveIfDirty]);

  useEffect(() => {
    const flushDrafts = () => entriesRef.current.forEach(entry => saveIfDirty(entry.clientId));
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') flushDrafts(); };
    window.addEventListener('online', flushDrafts);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('online', flushDrafts);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [saveIfDirty]);

  const handleComposition = useCallback((clientId: string, composing: boolean) => {
    if (composing) {
      composingIdsRef.current.add(clientId);
      cancelAutosave(clientId);
    } else {
      composingIdsRef.current.delete(clientId);
      scheduleAutosave(clientId);
    }
  }, [cancelAutosave, scheduleAutosave]);

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
    cancelAutosave(clientId);
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
      publishReport(toPayload(entry), true);
    } catch (error) {
      console.error('Error deleting entry:', error);
      updateEntries(current => current.map(draft => draft.clientId === clientId ? { ...draft, status: entry.status } : draft));
      showError('Deletion Failed', 'Failed to delete entry. Please check your connection and try again.', 6000);
    }
  }, [cancelAutosave, updateEntries, publishReport, showError]);

  const handleSubmitAllEntries = useCallback((): Promise<void> => {
    const nonBlank = entriesRef.current.filter(entry => entry.date === pagedDate && (entry.id || !isBlankEntry(entry)));
    if (!nonBlank.length) {
      showWarning('No Data to Submit', 'All entries on this page are blank. Please fill in at least one field.', 5000);
      return Promise.resolve();
    }
    // Every click includes the current rows and retries failed saves, even
    // while a previous batch is pending. Each row still shares one request.
    const requests = nonBlank.map(entry => [entry.clientId, handleSubmitEntry(entry.clientId, true, false)] as const);
    const existing = bulkSavesRef.current.get(pagedDate);
    if (existing) {
      for (const [clientId, request] of requests) existing.requests.set(clientId, request);
      return existing.promise;
    }

    const batch: BulkSaveBatch = { promise: Promise.resolve(), requests: new Map(requests) };
    bulkSavesRef.current.set(pagedDate, batch);
    setSavingDates(current => new Set(current).add(pagedDate));
    batch.promise = Promise.resolve().then(async () => {
      try {
        while (true) {
          const pending = [...batch.requests];
          const results = await Promise.all(pending.map(([, request]) => request));
          // Include rows/retries added by clicks made while we were waiting.
          if (pending.length !== batch.requests.size || pending.some(([clientId, request]) => batch.requests.get(clientId) !== request)) continue;
          const savedCount = results.filter(Boolean).length;
          const failedCount = results.length - savedCount;
          if (savedCount > 0) showSuccess('Reports Saved', `${savedCount} report entr${savedCount === 1 ? 'y was' : 'ies were'} saved successfully.`, 3500);
          if (failedCount > 0) showWarning('Some Reports Were Not Saved', `${failedCount} report entr${failedCount === 1 ? 'y' : 'ies'} could not be saved. Please try again.`, 6000);
          break;
        }
      } finally {
        bulkSavesRef.current.delete(pagedDate);
        setSavingDates(current => {
          const remaining = new Set(current);
          remaining.delete(pagedDate);
          return remaining;
        });
      }
    });
    return batch.promise;
  }, [pagedDate, handleSubmitEntry, showSuccess, showWarning]);

  const timeRangeSuggestions = suggestions.time_ranges;
  const doctorNameSuggestions = suggestions.doctor_names;
  const districtSuggestions = suggestions.districts;

  return {
    entries: entriesForCurrentPage, isLoading, isLoadingSuggestions, savingAll, draftStorageError,
    recoveredCount: entries.filter(entry => entry.recovered).length,
    currentPage, sortedDates, pagedDate, focusedEntryIdRef,
    timeRangeSuggestions, doctorNameSuggestions, districtSuggestions,
    addEmptyEntry, handleChange, handleFocus, handleSubmitEntry, handleSubmitAllEntries,
    handleDelete, handleBlur: saveIfDirty, handleComposition, setCurrentPage, totalPages: sortedDates.length,
  };
};
