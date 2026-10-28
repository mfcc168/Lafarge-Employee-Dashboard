import { QueryClient, type QueryKey } from '@tanstack/react-query';
import type { ReportEntry } from '@interfaces/index';

// Explicit scopes prevent usernames, dates and list names from sharing a key.
export const reportKeys = {
  root: ['reports'] as const,
  all: (username?: string) => ['reports', username, 'all'] as const,
  day: (username: string | undefined, date: string) => ['reports', username, 'day', date] as const,
  week: (username: string | undefined, start: string, end: string) => ['reports', username, 'week', start, end] as const,
  suggestions: (username?: string) => ['report-suggestions', username] as const,
};

export type ReportSuggestions = {
  time_ranges: string[];
  doctor_names: string[];
  districts: string[];
};

export const emptyReportSuggestions: ReportSuggestions = { time_ranges: [], doctor_names: [], districts: [] };

function includesDate(key: QueryKey, date: string) {
  return key[2] === 'all' || (key[2] === 'day' && key[3] === date) ||
    (key[2] === 'week' && typeof key[3] === 'string' && typeof key[4] === 'string' && date >= key[3] && date <= key[4]);
}

function background(work: Promise<unknown>) {
  void work.catch(error => console.error('Error refreshing report cache:', error));
}

/** Publish only server-confirmed changes. Failed writes leave all lists intact. */
export function syncReportCaches(client: QueryClient, username: string | undefined, entry: ReportEntry, deleted = false) {
  const queries = client.getQueryCache().findAll({ queryKey: ['reports', username] });
  for (const query of queries) {
    const data = query.state.data as ReportEntry[] | undefined;
    const belongs = includesDate(query.queryKey, entry.date);
    const contained = data?.some(row => String(row.id) === String(entry.id));
    if (!belongs && !contained) continue;

    // Cancellation synchronously prevents an older GET from overwriting this
    // response, even if its transport ignores AbortSignal and resolves later.
    background(client.cancelQueries({ queryKey: query.queryKey, exact: true }));
    client.setQueryData<ReportEntry[]>(query.queryKey, old => {
      // Never turn an unrequested/unfinished list into a partial one-row list.
      if (!old) return old;
      const remaining = old.filter(row => String(row.id) !== String(entry.id));
      if (deleted || !belongs) return remaining;
      const index = old.findIndex(row => String(row.id) === String(entry.id));
      if (index >= 0) {
        remaining.splice(index, 0, entry);
        return remaining;
      }
      return [entry, ...remaining].sort((a, b) => b.date.localeCompare(a.date));
    });
    // Revalidate when next visited. An initial load interrupted above needs a
    // complete response now; populated lists need no request after each save.
    background(client.invalidateQueries({ queryKey: query.queryKey, exact: true, refetchType: data ? 'none' : 'active' }));
  }

  const suggestionsKey = reportKeys.suggestions(username);
  const hadSuggestions = client.getQueryData(suggestionsKey) !== undefined;
  background(client.cancelQueries({ queryKey: suggestionsKey, exact: true }));
  if (!deleted) {
    client.setQueryData<ReportSuggestions>(suggestionsKey, old => old && ({
      time_ranges: [...new Set([...old.time_ranges, entry.time_range].filter(Boolean))],
      doctor_names: [...new Set([...old.doctor_names, entry.doctor_name].filter(Boolean))],
      districts: [...new Set([...old.districts, entry.district].filter(Boolean))],
    }));
  }
  // Removed/renamed suggestions may still occur in another report. Refresh
  // their distinct values on the next focus/mount without reloading history.
  background(client.invalidateQueries({ queryKey: suggestionsKey, refetchType: hadSuggestions ? 'none' : 'active' }));
}
