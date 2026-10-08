import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyEntry } from './reportEntryDraft';
import { ReportDraftStorage } from './reportDraftStorage';

const scope = ['https://example.test', 'tester'] as const;
const draft = () => ({ ...createEmptyEntry('2026-09-30'), time_range: '09:00', revision: 1 });
beforeEach(() => localStorage.clear());

describe('unfinished report draft recovery', () => {
  it('scopes recovery by account and backend and excludes blank/confirmed reports', () => {
    const entry = draft();
    const store = new ReportDraftStorage(...scope);
    store.sync([entry, createEmptyEntry(entry.date), { ...draft(), id: '2', savedRevision: 1 }]);
    const recovered = new ReportDraftStorage(...scope).read();
    expect(recovered).toMatchObject([{ clientId: entry.clientId, client_request_id: entry.client_request_id, time_range: '09:00', recovered: true }]);
    expect(new ReportDraftStorage(scope[0], 'someone-else').read()).toEqual([]);
    expect(new ReportDraftStorage('https://other.test', scope[1]).read()).toEqual([]);
    store.sync([{ ...entry, id: '1', savedRevision: entry.revision }]);
    expect(new ReportDraftStorage(...scope).read()).toEqual([]);
  });

  it('a late acknowledgement cannot erase edits made in a newly opened editor', () => {
    const entry = draft();
    const oldEditor = new ReportDraftStorage(...scope);
    oldEditor.sync([entry]);
    const newEditor = new ReportDraftStorage(...scope);
    const [recovered] = newEditor.read();
    const edited = { ...recovered, revision: 2, time_range: '10:00' };
    newEditor.sync([edited], edited.clientId);
    oldEditor.sync([{ ...entry, id: '1', savedRevision: 1 }]);
    expect(new ReportDraftStorage(...scope).read()).toMatchObject([{ time_range: '10:00', revision: 2 }]);
  });

  it('saving or discarding one row does not remove another row or another tab\'s draft', () => {
    const first = draft();
    const second = draft();
    const third = draft();
    const store = new ReportDraftStorage(...scope);
    const otherTab = new ReportDraftStorage(...scope);
    store.sync([first, second]);
    otherTab.sync([third]);
    store.sync([{ ...first, id: '1', savedRevision: 1 }]);
    expect(new ReportDraftStorage(...scope).read().map(entry => entry.clientId)).toEqual([third.clientId]);
  });

  it('ignores malformed records without breaking valid draft recovery', () => {
    const entry = draft();
    const store = new ReportDraftStorage(...scope);
    store.sync([entry]);
    const prefix = localStorage.key(0)!.slice(0, -encodeURIComponent(entry.clientId).length);
    localStorage.setItem(prefix + 'broken', '{');
    localStorage.setItem(prefix + 'wrong-shape', JSON.stringify({ version: 1, entry: { clientId: 'wrong-shape' } }));
    expect(new ReportDraftStorage(...scope).read()).toHaveLength(1);
  });
});
