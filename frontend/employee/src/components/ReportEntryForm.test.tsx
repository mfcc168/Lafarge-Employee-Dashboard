import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReportEntryForm from './ReportEntryForm';

const toast = vi.hoisted(() => ({ showSuccess: vi.fn(), showWarning: vi.fn(), showError: vi.fn() }));
vi.mock('@context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'tester' }, accessToken: 'test-token' }) }));
vi.mock('@context/ToastContext', () => ({ useToast: () => toast }));
vi.mock('@configs/DotEnv', () => ({ backendUrl: 'https://example.test' }));
vi.mock('axios', () => ({ default: Object.assign(vi.fn(), { get: vi.fn(), delete: vi.fn(), isAxiosError: (e: unknown) => !!e && typeof e === 'object' && 'response' in e }) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const request = vi.mocked(axios as (config: AxiosRequestConfig) => Promise<Pick<AxiosResponse, 'data'> & Partial<AxiosResponse>>);
let client: QueryClient;
const rows = () => Array.from(document.querySelectorAll<HTMLElement>('.entry-container'));
const input = (index: number) => within(rows()[index]).getAllByRole('textbox')[0];
const save = (index: number) => within(rows()[index]).getByRole('button', { name: /^(Save|Update|Saving\.\.\.|Updating\.\.\.|Retry Save)$/ });
const saveAll = () => screen.getAllByRole<HTMLButtonElement>('button', { name: /^(Save All|Saving All\.\.\.)$/ })[0];
function type(index: number, value: string) {
  fireEvent.focus(input(index));
  fireEvent.change(input(index), { target: { value } });
}
async function setup() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><ReportEntryForm /></QueryClientProvider>);
  await screen.findByRole('button', { name: 'Add New Entry' });
  fireEvent.click(screen.getByRole('button', { name: 'Add New Entry' }));
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(axios.get).mockResolvedValue({ data: [] });
  vi.mocked(axios.delete).mockResolvedValue({ data: {} });
  request.mockImplementation(async (config: AxiosRequestConfig) => ({ data: { ...config.data, id: config.data.id ?? 'report-1' } }));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); client?.clear(); });

describe('report save workflow', () => {
  it('saves each previous row when focus moves quickly while a save is pending', async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValue(pending.promise);
    await setup();
    type(0, '09:00');
    type(1, '10:00');
    fireEvent.focus(input(2));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls.map(([config]) => config.data.time_range)).toEqual(['09:00', '10:00']);
    await act(async () => pending.resolve({ data: { id: 'saved' } }));
  });

  it('keeps Save All usable during auto-save and waits for the real failed result', async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, '09:00');
    fireEvent.focus(input(1));
    expect(saveAll().disabled).toBe(false);
    fireEvent.click(saveAll());
    expect(toast.showSuccess).not.toHaveBeenCalled();
    await act(async () => pending.reject(new Error('offline')));
    expect(toast.showSuccess).not.toHaveBeenCalled();
    expect(toast.showWarning).toHaveBeenCalledWith('Some Reports Were Not Saved', expect.any(String), 6000);
    expect(saveAll().disabled).toBe(false);
    fireEvent.click(saveAll());
    await waitFor(() => expect(toast.showSuccess).toHaveBeenCalledWith('Reports Saved', expect.any(String), 3500));
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('preserves edits made during POST and sends them as a PUT without losing focus', async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, '09:00');
    fireEvent.click(save(0));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    type(0, '09:30');
    const originalInput = input(0);
    await act(async () => pending.resolve({ data: { id: 'report-1' } }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect((input(0) as HTMLInputElement).value).toBe('09:30');
    expect(input(0)).toBe(originalInput);
    expect(request.mock.calls[1][0]).toMatchObject({ method: 'PUT', data: { time_range: '09:30' } });
  });

  it('releases the row controls after saving even if refreshing report caches hangs', async () => {
    await setup();
    vi.spyOn(client, 'invalidateQueries').mockReturnValue(new Promise(() => undefined));
    type(0, '09:00');
    fireEvent.click(save(0));
    await waitFor(() => expect((save(0) as HTMLButtonElement).disabled).toBe(false));
    expect(saveAll().disabled).toBe(false);
    expect(toast.showSuccess).toHaveBeenCalled();
  });

  it('auto-saves changes to an already saved row', async () => {
    await setup();
    type(0, '09:00');
    fireEvent.click(save(0));
    await waitFor(() => expect(within(rows()[0]).getByRole('button', { name: 'Update' })).toBeTruthy());
    type(0, '10:00');
    fireEvent.focus(input(1));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0]).toMatchObject({ method: 'PUT', data: { time_range: '10:00' } });
  });

  it('adds exactly one empty row when typing starts, and skips blank rows in Save All', async () => {
    await setup();
    expect(rows()).toHaveLength(1);
    type(0, '09:00');
    type(0, '09:30');
    expect(rows()).toHaveLength(2);
    fireEvent.click(saveAll());
    await waitFor(() => expect(toast.showSuccess).toHaveBeenCalled());
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data).not.toHaveProperty('clientId');
    expect(request.mock.calls[0][0].data).not.toHaveProperty('revision');
  });

  it('coalesces rapid Save clicks, auto-save and repeated Save All clicks into one POST', async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, '09:00');
    fireEvent.click(save(0));
    fireEvent.click(save(0));
    fireEvent.focus(input(1));
    fireEvent.click(saveAll());
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(toast.showSuccess).not.toHaveBeenCalled();
    await act(async () => pending.resolve({ data: { id: 'report-1' } }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(saveAll().disabled).toBe(false);
  });

  it('allows manually saving another row while auto-save is pending', async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, '09:00');
    type(1, '10:00');
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect((save(1) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(save(1));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0].data.time_range).toBe('10:00');
    await act(async () => pending.resolve({ data: { id: 'report-2' } }));
  });

  it('unlocks a timed-out row and reuses its draft key, updating edits after a replayed POST', async () => {
    request.mockRejectedValueOnce(new Error('timeout'));
    await setup();
    type(0, '09:00');
    fireEvent.focus(input(1));
    await waitFor(() => expect(toast.showError).toHaveBeenCalled());
    expect((save(0) as HTMLButtonElement).disabled).toBe(false);
    expect(within(rows()[0]).getByRole('status').textContent).toContain('Not saved');
    type(0, '10:00');
    request.mockResolvedValueOnce({ status: 200, data: { id: 'report-1', time_range: '09:00' } });
    fireEvent.click(save(0));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
    expect(request.mock.calls.map(([config]) => config.method)).toEqual(['POST', 'POST', 'PUT']);
    const keys = request.mock.calls.map(([config]) => config.data.client_request_id);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toMatch(/^[a-f0-9-]{36}$/);
    expect(request.mock.calls[0][0].timeout).toBe(30000);
    expect(request.mock.calls[2][0].data.time_range).toBe('10:00');
    expect(within(rows()[0]).getByRole('status').textContent).toBe('Saved');
  });

  it('preserves the correct row when another row is deleted during a POST', async () => {
    const stored = { id: 'existing', date: new Date().toISOString().split('T')[0], time_range: '08:00',
      doctor_name: '', district: '', client_type: 'doctor', new_client: false, orders: '', tel_orders: '',
      samples: '', new_product_intro: '', old_product_followup: '', delivery_time_update: '', salesman_name: '' };
    vi.mocked(axios.get).mockImplementation(async (_url, config) => ({ data: config?.params?.date ? [stored] : [] }));
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(1, '09:00');
    fireEvent.click(save(1));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(rows()).toHaveLength(2));
    await act(async () => pending.resolve({ data: { id: 'new-report' } }));
    expect((input(0) as HTMLInputElement).value).toBe('09:00');
    expect((input(1) as HTMLInputElement).value).toBe('');
    expect(rows()).toHaveLength(2);
    type(0, '09:30');
    fireEvent.click(save(0));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0].url).toContain('/new-report/');
  });

  it('does not put an old date\'s save response into the new date\'s row', async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, '09:00');
    fireEvent.click(save(0));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    const firstDate = request.mock.calls[0][0].data.date;
    fireEvent.click(screen.getByRole('button', { name: 'Prev date' }));
    await screen.findByRole('button', { name: 'Add New Entry' });
    fireEvent.click(screen.getByRole('button', { name: 'Add New Entry' }));
    type(0, '10:00');
    await act(async () => pending.resolve({ data: { id: 'old-date-report' } }));
    expect((input(0) as HTMLInputElement).value).toBe('10:00');
    fireEvent.click(save(0));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0]).toMatchObject({ method: 'POST', data: { time_range: '10:00' } });
    expect(request.mock.calls[1][0].data.date).not.toBe(firstDate);
  });

  it('keeps an edited saved row after failed auto-save and date navigation', async () => {
    await setup();
    type(0, '09:00');
    fireEvent.click(save(0));
    await waitFor(() => expect(within(rows()[0]).getByRole('status').textContent).toBe('Saved'));
    type(0, '10:00');
    request.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Prev date' }));
    await screen.findByRole('button', { name: 'Next date' });
    await waitFor(() => expect(toast.showError).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Next date' }));
    await screen.findByRole('button', { name: 'Add New Entry' });
    expect((input(0) as HTMLInputElement).value).toBe('10:00');
    fireEvent.click(save(0));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
    expect(request.mock.calls[2][0]).toMatchObject({ method: 'PUT', data: { time_range: '10:00' } });
  });

  it('treats a checked New Client field as data and auto-saves it', async () => {
    await setup();
    const checkbox = within(rows()[0]).getByRole('checkbox');
    fireEvent.focus(checkbox);
    fireEvent.click(checkbox);
    expect(rows()).toHaveLength(2);
    fireEvent.focus(input(1));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0][0].data.new_client).toBe(true);
  });
});
