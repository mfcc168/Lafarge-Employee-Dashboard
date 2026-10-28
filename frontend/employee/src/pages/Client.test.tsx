import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@interfaces/AuthContextType';
import type { ReportEntry } from '@interfaces/ReportEntryType';
import Client from './Client';

const mocks = vi.hoisted(() => ({
  entries: [] as ReportEntry[],
  user: { username: 'manager', firstname: 'Test', lastname: 'Manager', role: 'MANAGER' } as User,
}));
vi.mock('@hooks/useGetAllReportEntries', () => ({
  useGetAllReportEntries: () => ({ data: mocks.entries, isLoading: false, isError: false }),
}));
vi.mock('@context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));

function entry(id: string, date: string, doctor_name: string, salesman_name = 'Ho Yeung Cheung'): ReportEntry {
  return {
    id, date, doctor_name, salesman_name, time_range: '09:00 - 10:00', district: 'Central',
    client_type: 'doctor', new_client: false, orders: id, samples: '', tel_orders: '',
    new_product_intro: '', old_product_followup: '', delivery_time_update: '',
  };
}
const monthFilter = () => screen.getByRole('combobox', { name: 'Filter by month' });
const selectMonth = (value: string) => fireEvent.change(monthFilter(), { target: { value } });
const clientNames = () => screen.queryAllByRole('heading', { level: 2 }).map(heading => heading.textContent);

beforeEach(() => {
  mocks.user = { username: 'manager', firstname: 'Test', lastname: 'Manager', role: 'MANAGER' };
  mocks.entries = [
    entry('december-2025', '2025-12-31', 'Alpha Clinic'),
    entry('january-start', '2026-01-01', 'Alpha Clinic'),
    entry('january-end', '2026-01-31', 'Alpha Clinic'),
    entry('february', '2026-02-01', 'Beta Clinic'),
    entry('december-2026', '2026-12-01', 'Gamma Clinic'),
    entry('dominic-january', '2026-01-15', 'Delta Clinic', 'Hung Ki So'),
    entry('dominic-march', '2026-03-15', 'Other Clinic', 'Hung Ki So'),
  ];
});
afterEach(cleanup);

describe('client month filter', () => {
  it('starts with all history and offers distinct months newest first, including the year', () => {
    render(<Client />);
    expect((monthFilter() as HTMLSelectElement).value).toBe('all');
    expect(within(monthFilter()).getAllByRole('option').map(option => option.textContent)).toEqual([
      'All Months', 'December 2026', 'March 2026', 'February 2026', 'January 2026', 'December 2025',
    ]);
    expect(clientNames()).toHaveLength(5);
    selectMonth('2025-12');
    expect(clientNames()).toEqual(['Alpha Clinic']);
    expect(screen.getByText('Orders: december-2025')).toBeTruthy();
    expect(screen.queryByText('Orders: december-2026')).toBeNull();
    selectMonth('all');
    expect(clientNames()).toHaveLength(5);
    expect(screen.getByText('Orders: december-2026')).toBeTruthy();
  });

  it('filters visit details and visit counts before grouping, including both month boundaries', () => {
    render(<Client />);
    selectMonth('2026-01');
    expect(clientNames()).toEqual(['Alpha Clinic', 'Delta Clinic']);
    const alpha = screen.getByRole('heading', { name: 'Alpha Clinic' }).closest('li')!;
    expect(within(alpha).getByText(/Visits:/).textContent).toBe('Visits: 2');
    expect(within(alpha).getByText('Orders: january-start')).toBeTruthy();
    expect(within(alpha).getByText('Orders: january-end')).toBeTruthy();
    expect(screen.queryByText('Orders: december-2025')).toBeNull();
    expect(screen.queryByText('Orders: february')).toBeNull();
  });

  it('combines the month with salesman and client-name filters', () => {
    render(<Client />);
    selectMonth('2026-01');
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by salesman' }), {
      target: { value: 'Hung Ki So' },
    });
    expect(clientNames()).toEqual(['Delta Clinic']);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dElTa' } });
    expect(clientNames()).toEqual(['Delta Clinic']);
    selectMonth('2026-03');
    expect(screen.getByText('No clients match your criteria.')).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(clientNames()).toEqual(['Other Clinic']);
  });

  it('keeps salesmen restricted to their own visits and month choices', () => {
    mocks.user = { username: 'alex', firstname: 'Ho Yeung', lastname: 'Cheung', role: 'SALESMAN' };
    render(<Client />);
    expect(screen.queryByRole('combobox', { name: 'Filter by salesman' })).toBeNull();
    expect(within(monthFilter()).queryByRole('option', { name: 'March 2026' })).toBeNull();
    selectMonth('2026-01');
    expect(clientNames()).toEqual(['Alpha Clinic']);
    expect(screen.queryByText('Orders: dominic-january')).toBeNull();
  });

  it('returns to the first page when the selected month changes', () => {
    mocks.entries = [
      ...Array.from({ length: 6 }, (_, i) => entry(`january-${i}`, '2026-01-15', `January Clinic ${i}`)),
      entry('february', '2026-02-01', 'February Clinic'),
    ];
    render(<Client />);
    fireEvent.click(screen.getByRole('button', { name: 'Next Page' }));
    expect(clientNames()).toEqual(['January Clinic 5', 'February Clinic']);
    selectMonth('2026-02');
    expect(clientNames()).toEqual(['February Clinic']);
    expect((screen.getByRole('button', { name: 'First Page' }) as HTMLButtonElement).disabled).toBe(true);
    selectMonth('2026-01');
    expect(clientNames()).toEqual(Array.from({ length: 5 }, (_, i) => `January Clinic ${i}`));
  });

  it('keeps empty results on a valid page with all navigation disabled', () => {
    render(<Client />);
    selectMonth('2026-02');
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by salesman' }), {
      target: { value: 'Hung Ki So' },
    });
    expect(screen.getByText('No clients match your criteria.')).toBeTruthy();
    for (const name of ['First Page', 'Previous Page', 'Next Page', 'Last Page']) {
      const button = screen.getByRole('button', { name }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(screen.getByText(/Showing/).textContent).toBe('Showing 0 - 0 of 0 clients');
    selectMonth('2026-03');
    expect(clientNames()).toEqual(['Other Clinic']);
    expect(screen.getByText(/Showing/).textContent).toBe('Showing 1 - 1 of 1 clients');
  });
});
