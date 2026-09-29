import { ReportEntry } from '@interfaces/index';

export type FormEntry = ReportEntry & {
  clientId: string;
  revision: number;
  savedRevision: number;
  status: 'idle' | 'saving' | 'error' | 'deleting';
};

// randomUUID is unavailable on plain HTTP deployments; getRandomValues also
// works there and still gives each draft a stable UUID for retry protection.
function draftId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const fromServer = (entry: ReportEntry, clientId = `saved-${entry.id}`): FormEntry => ({
  ...entry, clientId, revision: 0, savedRevision: 0, status: 'idle',
});

export const createEmptyEntry = (date: string): FormEntry => {
  const clientId = draftId();
  return {
    clientId, client_request_id: clientId, revision: 0, savedRevision: -1, status: 'idle',
    date, time_range: '', doctor_name: '', district: '', client_type: 'doctor', new_client: false,
    orders: '', samples: '', tel_orders: '', new_product_intro: '', old_product_followup: '',
    delivery_time_update: '', salesman_name: '',
  };
};

export const isDirty = (entry: FormEntry) => !entry.id || entry.revision > entry.savedRevision;

export const isBlankEntry = (entry: ReportEntry) => !entry.new_client && entry.client_type === 'doctor' &&
  ![entry.time_range, entry.doctor_name, entry.district, entry.orders, entry.samples,
    entry.tel_orders, entry.new_product_intro, entry.old_product_followup, entry.delivery_time_update]
    .some(value => value?.trim());

// Keep UI metadata out of API requests.
export const toPayload = (entry: FormEntry): ReportEntry => ({
  id: entry.id, client_request_id: entry.client_request_id, date: entry.date,
  time_range: entry.time_range, doctor_name: entry.doctor_name, district: entry.district,
  client_type: entry.client_type, new_client: entry.new_client, orders: entry.orders,
  samples: entry.samples, tel_orders: entry.tel_orders, new_product_intro: entry.new_product_intro,
  old_product_followup: entry.old_product_followup, delivery_time_update: entry.delivery_time_update,
  salesman_name: entry.salesman_name,
});
