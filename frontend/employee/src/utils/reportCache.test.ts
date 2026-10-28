import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { emptyReportSuggestions, reportKeys, syncReportCaches } from './reportCache';
import { createEmptyEntry, toPayload } from './reportEntryDraft';

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const entry = { ...toPayload(createEmptyEntry('2026-09-29')), id: '1', doctor_name: 'Dr Lee', time_range: '09:00' };
afterEach(() => client.clear());

describe('report cache synchronization', () => {
  it('moves an edited report between date/week lists and leaves unrelated users and dates alone', () => {
    const old = { ...entry, date: '2026-09-22' };
    const oldDay = reportKeys.day('tester', old.date);
    const newDay = reportKeys.day('tester', entry.date);
    const oldWeek = reportKeys.week('tester', '2026-09-21', '2026-09-27');
    const newWeek = reportKeys.week('tester', '2026-09-28', '2026-10-04');
    const unrelated = reportKeys.day('tester', '2026-09-01');
    const otherUser = reportKeys.all('other-user');
    [oldDay, oldWeek, otherUser, reportKeys.all('tester')].forEach(key => client.setQueryData(key, [old]));
    [newDay, newWeek, unrelated].forEach(key => client.setQueryData(key, []));
    syncReportCaches(client, 'tester', entry);
    [oldDay, oldWeek].forEach(key => expect(client.getQueryData(key)).toEqual([]));
    [newDay, newWeek, reportKeys.all('tester')].forEach(key => expect(client.getQueryData(key)).toEqual([entry]));
    expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
    expect(client.getQueryData(otherUser)).toEqual([old]);
    syncReportCaches(client, 'tester', entry, true);
    [newDay, newWeek, reportKeys.all('tester')].forEach(key => expect(client.getQueryData(key)).toEqual([]));
  });

  it.each([false, true])('prevents a late GET from reverting a confirmed save/delete (deleted=%s)', async deleted => {
    const key = reportKeys.all('tester');
    const old = { ...entry, time_range: '08:00' };
    client.setQueryData(key, [old]);
    let resolve!: (data: typeof entry[]) => void;
    const fetch = client.fetchQuery({ queryKey: key, queryFn: () => new Promise<typeof entry[]>(done => { resolve = done; }) });
    const cancelled = fetch.catch(() => undefined);
    syncReportCaches(client, 'tester', entry, deleted);
    resolve([old]);
    await cancelled;
    expect(client.getQueryData(key)).toEqual(deleted ? [] : [entry]);
  });

  it('reloads an interrupted initial list instead of caching only the changed row', async () => {
    const key = reportKeys.all('tester');
    let resolveOld!: (data: typeof entry[]) => void;
    let resolveFresh!: (data: typeof entry[]) => void;
    let calls = 0;
    const observer = new QueryObserver(client, {
      queryKey: key,
      queryFn: () => new Promise<typeof entry[]>(resolve => {
        if (++calls === 1) resolveOld = resolve;
        else resolveFresh = resolve;
      }),
    });
    const unsubscribe = observer.subscribe(() => undefined);
    syncReportCaches(client, 'tester', entry);
    expect(client.getQueryData(key)).toBeUndefined();
    expect(calls).toBe(2);
    resolveOld([]);
    const fullList = [entry, { ...entry, id: '2', doctor_name: 'Dr Wong' }];
    resolveFresh(fullList);
    await client.getQueryCache().find({ queryKey: key })?.promise;
    expect(client.getQueryData(key)).toEqual(fullList);
    unsubscribe();
  });

  it('does not create an incomplete list cache and prevents stale suggestion responses', async () => {
    const key = reportKeys.suggestions('tester');
    client.setQueryData(key, emptyReportSuggestions);
    let resolve!: (data: typeof emptyReportSuggestions) => void;
    const fetching = client.fetchQuery({ queryKey: key, queryFn: () => new Promise<typeof emptyReportSuggestions>(done => { resolve = done; }) });
    const cancelled = fetching.catch(() => undefined);
    syncReportCaches(client, 'tester', entry);
    resolve(emptyReportSuggestions);
    await cancelled;
    expect(client.getQueryData(reportKeys.all('tester'))).toBeUndefined();
    expect(client.getQueryData(key)).toMatchObject({ doctor_names: ['Dr Lee'], time_ranges: ['09:00'] });
  });
});
