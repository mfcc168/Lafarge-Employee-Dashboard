import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import type { EmployeeProfile } from "@interfaces/index";
import { updateEmployeeCaches } from "@utils/employeeCache";
import { useAllEmployeePayroll } from "./useAllEmployeePayroll";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));
vi.mock("@configs/DotEnv", () => ({
  backendUrl: "https://employee.example.test",
  apiUrl: "https://erp.example.test",
}));
vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "ADMIN" }, accessToken: "test-token" }),
}));

const employee: EmployeeProfile = {
  id: 1,
  user: {
    id: 1,
    username: "alex",
    first_name: "Alex",
    last_name: "Cheung",
    email: "alex@example.test",
  },
  role: "SALESMAN",
  base_salary: "22000.00",
  bonus_payment: "1200.00",
  year_end_bonus: "0.00",
  transportation_allowance: "800.00",
  is_mpf_exempt: false,
  is_active: true,
  annual_leave_days: 14,
};
let profiles: EmployeeProfile[];
let commission: number;
let clients: QueryClient[];

function createClient() {
  // Match the application's defaults, which payroll must override.
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60_000, gcTime: 24 * 60 * 60_000, retry: false },
    },
  });
  clients.push(client);
  return client;
}

function mount(client = createClient()) {
  return {
    client,
    ...renderHook(() => useAllEmployeePayroll(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  clients = [];
  profiles = [employee];
  commission = 1000;
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
  vi.mocked(axios.get).mockImplementation(async (url) => ({
    data: String(url).endsWith("/api/salaries/")
      ? profiles
      : [{ salesman: "Alex Cheung", commission }],
  }));
});

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
  vi.useRealTimers();
});

describe("live payroll data", () => {
  it("discards payroll on leaving and fetches current employees and commissions on return", async () => {
    const first = mount();
    await waitFor(() => expect(first.result.current.hasData).toBe(true));
    expect(first.result.current.profiles).toEqual([employee]);
    expect(first.result.current.commissions).toEqual({ alex: 1000 });
    for (const [, config] of vi.mocked(axios.get).mock.calls) {
      expect(config?.params).toEqual({ _: expect.any(Number) });
    }

    first.unmount();
    await waitFor(() =>
      expect(first.client.getQueryCache().getAll()).toHaveLength(0),
    );
    profiles = [];
    commission = 2000;
    const second = mount(first.client);
    expect(second.result.current.isLoading).toBe(true);
    await waitFor(() => expect(second.result.current.hasData).toBe(true));
    expect(second.result.current.profiles).toEqual([]);
    expect(second.result.current.commissions).toEqual({ alex: 2000 });
    expect(axios.get).toHaveBeenCalledTimes(4);
  });

  it("reloads after an acknowledged employee change without waiting for the refresh interval", async () => {
    const { client, result } = mount();
    await waitFor(() => expect(result.current.hasData).toBe(true));
    profiles = [{ ...employee, base_salary: "25000.00", is_mpf_exempt: true }];
    await act(async () => {
      await updateEmployeeCaches(client, "test-token", employee.id, profiles[0]);
    });
    await waitFor(() => expect(result.current.profiles).toEqual(profiles));

    profiles = [];
    await act(async () => {
      await updateEmployeeCaches(client, "test-token", employee.id, { is_active: false });
    });
    await waitFor(() => expect(result.current.profiles).toEqual([]));
    expect(axios.get).toHaveBeenCalledTimes(4);
  });

  it("refreshes employee details on browser focus and connection recovery", async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.hasData).toBe(true));
    act(() => focusManager.setFocused(false));
    profiles = [{ ...employee, base_salary: "25000.00" }];
    commission = 2000;
    act(() => focusManager.setFocused(true));
    await waitFor(() => expect(result.current.profiles).toEqual(profiles));
    await waitFor(() => expect(result.current.commissions).toEqual({ alex: 2000 }));

    act(() => onlineManager.setOnline(false));
    profiles = [];
    act(() => onlineManager.setOnline(true));
    await waitFor(() => expect(result.current.profiles).toEqual([]));
    expect(axios.get).toHaveBeenCalledTimes(6);
  });

  it("refreshes every 30 seconds while the payroll page stays open", async () => {
    vi.useFakeTimers();
    const { result } = mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.hasData).toBe(true);

    profiles = [];
    commission = 2000;
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(result.current.profiles).toEqual([]);
    expect(result.current.commissions).toEqual({ alex: 2000 });
    expect(axios.get).toHaveBeenCalledTimes(4);
  });

  it("cancels pending payroll reads when the page is left", () => {
    vi.mocked(axios.get).mockImplementation(() => new Promise(() => {}));
    const { unmount } = mount();
    const signals = vi.mocked(axios.get).mock.calls.map(([, config]) => config?.signal);
    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal?.aborted === false)).toBe(true);
    unmount();
    expect(signals.every((signal) => signal?.aborted === true)).toBe(true);
  });
});
