import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  calculateBusinessDays,
  getExcludedDatesInRange,
} from "@utils/businessDays";
import { useVacationRequestForm } from "./useVacationRequestForm";

const feedback = vi.hoisted(() => ({
  showWarning: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  refreshUser: vi.fn(),
}));
vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({
    user: { username: "tester", annual_leave_days: 14 },
    accessToken: "test-token",
    refreshUser: feedback.refreshUser,
  }),
}));
vi.mock("@context/ToastContext", () => ({ useToast: () => feedback }));
vi.mock("@configs/DotEnv", () => ({ backendUrl: "https://example.test" }));
vi.mock("@utils/businessDays", () => ({
  calculateBusinessDays: vi.fn(),
  getExcludedDatesInRange: vi.fn(),
}));
vi.mock("axios", () => ({ default: { post: vi.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderHook(() => useVacationRequestForm(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
const dates = (from_date: string, to_date = from_date) => ({
  type: "full" as const,
  leave_type: "Annual Leave" as const,
  from_date,
  to_date,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(calculateBusinessDays).mockResolvedValue(2);
  vi.mocked(getExcludedDatesInRange).mockResolvedValue([]);
  vi.mocked(axios.post).mockResolvedValue({ data: {} });
});
afterEach(cleanup);

describe("vacation request feedback", () => {
  it("keeps the newest balance calculation pending when an older calculation finishes", async () => {
    const older = deferred<number>(),
      newer = deferred<number>();
    vi.mocked(calculateBusinessDays).mockImplementation((from) =>
      from === "2026-10-05" ? older.promise : newer.promise,
    );
    const { result } = setup();
    act(() => result.current.updateItem(0, dates("2026-10-05")));
    await waitFor(() =>
      expect(calculateBusinessDays).toHaveBeenCalledWith(
        "2026-10-05",
        "2026-10-05",
      ),
    );
    act(() => result.current.updateItem(0, dates("2026-10-07")));
    await waitFor(() =>
      expect(calculateBusinessDays).toHaveBeenCalledWith(
        "2026-10-07",
        "2026-10-07",
      ),
    );
    await act(async () => {
      older.resolve(10);
      await older.promise;
    });
    expect(result.current.calculating).toBe(true);
    expect(result.current.getTotalVacationDay).toBe(0);
    await act(async () => {
      newer.resolve(2);
      await newer.promise;
    });
    await waitFor(() => expect(result.current.calculating).toBe(false));
    expect(result.current.getTotalVacationDay).toBe(2);
    expect(result.current.getVacationDayLeft).toBe(12);
  });

  it("does not restore old days or excluded dates after dates are cleared", async () => {
    const pending = deferred<number>();
    vi.mocked(calculateBusinessDays).mockReturnValue(pending.promise);
    vi.mocked(getExcludedDatesInRange).mockResolvedValue([
      { date: "2026-10-10", reason: "Weekend" },
    ]);
    const { result } = setup();
    act(() => result.current.updateItem(0, dates("2026-10-05", "2026-10-11")));
    await waitFor(() => expect(result.current.calculating).toBe(true));
    act(() => result.current.updateItem(0, dates("", "")));
    await waitFor(() => expect(result.current.calculating).toBe(false));
    await act(async () => {
      pending.resolve(5);
      await pending.promise;
    });
    expect(result.current.getTotalVacationDay).toBe(0);
    expect(result.current.getVacationDayLeft).toBe(14);
    expect(result.current.excludedDates).toEqual([]);
  });

  it("waits for the balance calculation before allowing submission", async () => {
    const pending = deferred<number>();
    vi.mocked(calculateBusinessDays).mockReturnValue(pending.promise);
    const { result } = setup();
    act(() => {
      result.current.updateItem(0, dates("2026-10-05"));
      result.current.setSignatureData("data:image/png;base64,signature");
    });
    await waitFor(() => expect(result.current.calculating).toBe(true));
    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });
    expect(axios.post).not.toHaveBeenCalled();
    await act(async () => {
      pending.resolve(2);
      await pending.promise;
    });
    await waitFor(() => expect(result.current.calculating).toBe(false));
    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(true);
    });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("retains the dates and signature when submission fails", async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error("Request failed"));
    const { result } = setup();
    act(() => {
      result.current.updateItem(0, dates("2026-10-05", "2026-10-06"));
      result.current.setSignatureData("data:image/png;base64,signature");
    });
    await waitFor(() => expect(result.current.calculating).toBe(false));
    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });
    expect(result.current.dateItems).toEqual([
      dates("2026-10-05", "2026-10-06"),
    ]);
    expect(result.current.signatureData).toBe(
      "data:image/png;base64,signature",
    );
    expect(result.current.submitting).toBe(false);
    expect(feedback.showError).toHaveBeenCalledWith(
      "Submission Failed",
      expect.any(String),
    );
  });
});
