import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { useSalesmanMonthlyReport } from "./useSalesmanMonthlyReport";
import type { Invoice } from "@interfaces/index";
vi.mock("axios", () => ({ default: { get: vi.fn() } }));
vi.mock("@configs/DotEnv", () => ({ apiUrl: "https://example.test" }));
const invoice: Invoice = {
  number: "INV-1",
  customer: "Clinic",
  care_of: "",
  sample_customer: null,
  salesman: "alex",
  total_price: 100,
  delivery_date: "2026-10-01",
  payment_date: null,
  items: [],
};
const report = {
  weeks: {
    1: {
      invoices: Array.from({ length: 6 }, (_, i) => ({
        ...invoice,
        number: `INV-${i}`,
      })),
      total: 600,
    },
  },
  invoice_shares_data: [invoice],
  year: 2026,
  month: 10,
  monthly_total: 600,
  salesman: "Alex",
  commission: 60,
  monthly_total_share: 100,
  monthly_total_share_percentage: 0.1,
  personal_monthly_total_share: 10,
  sales_monthly_total: 600,
  incentive_percentage: 0.1,
};
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useSalesmanMonthlyReport({ salesmanName: "alex" }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(axios.get).mockResolvedValue({ data: report });
});
afterEach(cleanup);
describe("sales section continuity", () => {
  it("preserves the open week and page through background refresh, then clamps a shorter list", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toBeTruthy());
    act(() => result.current.handleExpandWeek(1));
    act(() => result.current.handleNextPage());
    expect(result.current.currentPage).toBe(2);
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.expandedWeek).toBe(1);
    expect(result.current.currentPage).toBe(2);
    vi.mocked(axios.get).mockResolvedValue({
      data: { ...report, weeks: { 1: { invoices: [invoice], total: 100 } } },
    });
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.expandedWeek).toBe(1);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginateInvoices([invoice])).toEqual([invoice]);
  });
  it("resets week, shared details and pagination when the selected month changes", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toBeTruthy());
    act(() => {
      result.current.handleExpandWeek(1);
      result.current.toggleSharedExpanded();
    });
    act(() => result.current.handleNextPage());
    const month = result.current.currentDate.month;
    act(() => result.current.navigateMonth(-1));
    expect(result.current.currentDate.month).toBe(month === 1 ? 12 : month - 1);
    expect(result.current.expandedWeek).toBeNull();
    expect(result.current.sharedExpanded).toBe(false);
    expect(result.current.currentPage).toBe(1);
  });
  it("retains cached invoices and the open section after a failed refresh", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toBeTruthy());
    act(() => result.current.handleExpandWeek(1));
    vi.mocked(axios.get).mockRejectedValue(new Error("Refresh unavailable"));
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() =>
      expect(result.current.error).toBe("Refresh unavailable"),
    );
    expect(result.current.data?.weeks[1].invoices).toHaveLength(6);
    expect(result.current.expandedWeek).toBe(1);
  });
});
