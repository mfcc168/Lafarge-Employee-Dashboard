import { type FormEntry, isBlankEntry, isDirty, toPayload } from './reportEntryDraft';

const textFields = ['time_range', 'doctor_name', 'district', 'orders', 'samples', 'tel_orders',
  'new_product_intro', 'old_product_followup', 'delivery_time_update', 'salesman_name'] as const;

function parseDraft(raw: string): FormEntry | null {
  try {
    const { version, entry } = JSON.parse(raw);
    if (version !== 1 || !entry || typeof entry.clientId !== 'string' || !entry.clientId ||
      typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      !Number.isSafeInteger(entry.revision) || entry.revision < 0 ||
      !Number.isSafeInteger(entry.savedRevision) || entry.savedRevision < -1 ||
      (entry.id != null && typeof entry.id !== 'string' && typeof entry.id !== 'number') ||
      (entry.client_type !== 'doctor' && entry.client_type !== 'nurse') ||
      typeof entry.new_client !== 'boolean' || textFields.some(field => typeof entry[field] !== 'string') ||
      (!entry.id && (typeof entry.client_request_id !== 'string' ||
        !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(entry.client_request_id)))) return null;
    const draft: FormEntry = {
      ...toPayload(entry), clientId: entry.clientId, revision: entry.revision,
      savedRevision: entry.savedRevision, status: 'idle', recovered: true,
    };
    return isDirty(draft) && (draft.id || !isBlankEntry(draft)) ? draft : null;
  } catch {
    return null;
  }
}

/** Only unfinished drafts, scoped to the backend and signed-in account.
 * Each row has its own key: saving one row cannot erase another row's draft.
 */
export class ReportDraftStorage {
  private readonly prefix: string;
  private readonly versions = new Map<string, string>();

  constructor(backend: string, username: string, private readonly storage = () => window.localStorage) {
    this.prefix = `lafarge:report-draft:v1:${encodeURIComponent(backend)}:${encodeURIComponent(username)}:`;
  }

  private key(clientId: string) { return this.prefix + encodeURIComponent(clientId); }

  read(): FormEntry[] {
    const storage = this.storage();
    const drafts: FormEntry[] = [];
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (!key?.startsWith(this.prefix)) continue;
      const raw = storage.getItem(key);
      const draft = raw && parseDraft(raw);
      if (!draft || this.key(draft.clientId) !== key) continue;
      this.versions.set(draft.clientId, raw);
      drafts.push(draft);
    }
    return drafts;
  }

  sync(entries: FormEntry[], editedId?: string) {
    const storage = this.storage();
    const pending = entries.filter(entry => isDirty(entry) && (entry.id || !isBlankEntry(entry)));
    const ids = new Set(pending.map(entry => entry.clientId));
    const stored = new Set<string>();

    for (const entry of pending) {
      const key = this.key(entry.clientId);
      const previous = this.versions.get(entry.clientId);
      const current = storage.getItem(key);
      // A delayed completion from an old editor must not overwrite a draft
      // edited after navigation/reload. Only explicit typing takes ownership.
      if (entry.clientId !== editedId && current !== (previous ?? null)) continue;
      const raw = JSON.stringify({ version: 1, entry: {
        ...toPayload(entry), clientId: entry.clientId,
        revision: entry.revision, savedRevision: entry.savedRevision,
      } });
      if (raw !== current) storage.setItem(key, raw);
      this.versions.set(entry.clientId, raw);
      stored.add(entry.clientId);
    }

    for (const [clientId, previous] of this.versions) {
      if (ids.has(clientId)) continue;
      const key = this.key(clientId);
      // Clear only the exact draft this editor acknowledged/discarded.
      if (storage.getItem(key) === previous) storage.removeItem(key);
      this.versions.delete(clientId);
    }
    return stored;
  }
}
