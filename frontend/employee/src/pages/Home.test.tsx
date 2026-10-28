import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { addDays, format, parseISO, startOfISOWeek } from "date-fns";
import axios from "axios";
import Home from "./Home";
import { reportKeys } from "@utils/reportCache";
import type { ReportEntry } from "@interfaces/index";

vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "test-token",
    isAuthenticated: true,
    user: {
      username: "alex",
      firstname: "Ho Yeung",
      lastname: "Cheung",
      role: "ADMIN",
    },
  }),
}));
vi.mock("@configs/DotEnv", () => ({ backendUrl: "https://example.test" }));
vi.mock("axios", () => ({ default: { get: vi.fn() } }));
vi.mock("@components/LazyComponents", async () => ({
  LazyReportEntryList: (await import("../components/ReportEntryList")).default,
  LazyWeeklySamplesSummary: (await import("../components/WeeklySamplesSummary"))
    .default,
  LazyWeeklyNewClientOrder: (await import("../components/WeeklyNewClientOrder"))
    .default,
}));
const today = format(new Date(), "yyyy-MM-dd");
const start = format(startOfISOWeek(new Date()), "yyyy-MM-dd");
const end = format(addDays(parseISO(start), 6), "yyyy-MM-dd");
const entry: ReportEntry = {
  id: "1",
  date: today,
  time_range: "0900-1000",
  doctor_name: "Dr. Chan",
  district: "Central",
  salesman_name: "Ho Yeung Cheung",
  client_type: "doctor",
  new_client: true,
  orders: "Order",
  samples: "Current sample",
  tel_orders: "",
  new_product_intro: "",
  old_product_followup: "",
  delivery_time_update: "",
};
const entries = [entry, { ...entry, id: "2", doctor_name: "Dr. Lee" }];
const clients: QueryClient[] = [];
function setup(cached = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  if (cached) {
    client.setQueryData(reportKeys.day("alex", today), entries);
    client.setQueryData(reportKeys.week("alex", start, end), entries);
  }
  const result = render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <Home />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return { ...result, client };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(axios.get).mockResolvedValue({ data: entries });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe("Overview query feedback and navigation", () => {
  it("retains cached tables and summary counts on refresh failure, with one scoped weekly retry", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("Unavailable"));
    const { client, container } = setup(true);
    await act(async () => {
      await client.invalidateQueries({
        queryKey: reportKeys.week("alex", start, end),
        exact: true,
      });
    });
    const weekly = within(
      screen.getByRole("region", { name: "Weekly activity" }),
    );
    await waitFor(() =>
      expect(weekly.getByRole("alert").textContent).toContain(
        "Showing your previous results.",
      ),
    );
    expect(
      Array.from(
        container.querySelectorAll(".stat-value"),
        (el) => el.textContent,
      ),
    ).toEqual(["2", "2", "2"]);
    expect(
      within(screen.getByRole("table", { name: /^Samples/ })).getAllByText(
        "Current sample",
      ),
    ).toHaveLength(2);
    expect(weekly.getAllByRole("button", { name: "Try again" })).toHaveLength(
      1,
    );
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ ...entry, new_client: false, orders: "" }],
    });
    fireEvent.click(weekly.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(weekly.queryByRole("alert")).toBeNull());
    expect(
      Array.from(
        container.querySelectorAll(".stat-value"),
        (el) => el.textContent,
      ),
    ).toEqual(["1", "0", "0"]);
  });
  it("uses one week control and cancels an older request during rapid navigation", async () => {
    const previous = format(addDays(parseISO(start), -7), "yyyy-MM-dd");
    const earlier = format(addDays(parseISO(start), -14), "yyyy-MM-dd");
    let resolvePrevious!: (response: { data: ReportEntry[] }) => void;
    let resolveEarlier!: (response: { data: ReportEntry[] }) => void;
    let previousSignal: AbortSignal | undefined;
    vi.mocked(axios.get).mockImplementation((url, config) => {
      if (url.includes("by-date") && config?.params.start_date === previous) {
        previousSignal = config.signal as AbortSignal;
        return new Promise((resolve) => {
          resolvePrevious = resolve;
        });
      }
      if (url.includes("by-date") && config?.params.start_date === earlier) {
        return new Promise((resolve) => {
          resolveEarlier = resolve;
        });
      }
      return Promise.resolve({ data: entries });
    });
    setup();
    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: /^Samples/ }).textContent,
      ).toContain("Current sample"),
    );
    expect(
      screen.getAllByRole("button", { name: "Previous week" }),
    ).toHaveLength(1);
    const previousButton = screen.getByRole("button", {
      name: "Previous week",
    });
    fireEvent.click(previousButton);
    await waitFor(() => expect(resolvePrevious).toBeDefined());
    expect(previousButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(previousButton);
    await waitFor(() => expect(resolveEarlier).toBeDefined());
    expect(previousSignal?.aborted).toBe(true);
    await act(async () => {
      resolveEarlier({ data: [{ ...entry, samples: "Latest week sample" }] });
    });
    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: /^Samples/ }).textContent,
      ).toContain("Latest week sample"),
    );
    await act(async () => {
      resolvePrevious({ data: [{ ...entry, samples: "Stale week sample" }] });
    });
    expect(screen.queryByText("Stale week sample")).toBeNull();
  });
});
