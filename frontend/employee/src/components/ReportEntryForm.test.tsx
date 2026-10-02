import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReportEntryForm from "./ReportEntryForm";
import { StrictMode } from "react";
import { ReportDraftStorage } from "@utils/reportDraftStorage";
import { reportKeys, emptyReportSuggestions } from "@utils/reportCache";

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
  showError: vi.fn(),
}));
vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({ user: { username: "tester" }, accessToken: "test-token" }),
}));
vi.mock("@context/ToastContext", () => ({ useToast: () => toast }));
vi.mock("@configs/DotEnv", () => ({ backendUrl: "https://example.test" }));
vi.mock("axios", () => ({
  default: Object.assign(vi.fn(), {
    get: vi.fn(),
    delete: vi.fn(),
    isAxiosError: (e: unknown) =>
      !!e && typeof e === "object" && "response" in e,
  }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const request = vi.mocked(
  axios as (
    config: AxiosRequestConfig,
  ) => Promise<Pick<AxiosResponse, "data"> & Partial<AxiosResponse>>,
);
let client: QueryClient;
const rows = () =>
  Array.from(document.querySelectorAll<HTMLElement>(".entry-container"));
const input = (index: number) =>
  within(rows()[index]).getAllByRole("textbox")[0];
const saveAll = () =>
  screen.getByRole<HTMLButtonElement>("button", { name: "Save All" });
function type(index: number, value: string) {
  fireEvent.focus(input(index));
  fireEvent.change(input(index), { target: { value } });
}
async function setup(strict = false) {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const form = (
    <QueryClientProvider client={client}>
      <ReportEntryForm />
    </QueryClientProvider>
  );
  render(strict ? <StrictMode>{form}</StrictMode> : form);
  await screen.findByRole("button", { name: "Add New Entry" });
  fireEvent.click(screen.getByRole("button", { name: "Add New Entry" }));
}
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(axios.get).mockImplementation(async (url) => ({
    data: String(url).endsWith("/suggestions/") ? emptyReportSuggestions : [],
  }));
  vi.mocked(axios.delete).mockResolvedValue({ data: {} });
  request.mockImplementation(async (config: AxiosRequestConfig) => ({
    data: { ...config.data, id: config.data.id ?? "report-1" },
  }));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.useRealTimers();
});

describe("report save workflow", () => {
  it("saves each previous row when focus moves quickly while a save is pending", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValue(pending.promise);
    await setup();
    type(0, "09:00");
    type(1, "10:00");
    fireEvent.focus(input(2));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(
      request.mock.calls.map(([config]) => config.data.time_range),
    ).toEqual(["09:00", "10:00"]);
    await act(async () => pending.resolve({ data: { id: "saved" } }));
  });

  it("keeps Save All usable during auto-save and waits for the real failed result", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, "09:00");
    fireEvent.focus(input(1));
    expect(saveAll().disabled).toBe(false);
    fireEvent.click(saveAll());
    expect(toast.showSuccess).not.toHaveBeenCalled();
    await act(async () => pending.reject(new Error("offline")));
    expect(toast.showSuccess).not.toHaveBeenCalled();
    expect(toast.showWarning).toHaveBeenCalledWith(
      "Some Reports Were Not Saved",
      expect.any(String),
      6000,
    );
    expect(saveAll().disabled).toBe(false);
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        "Reports Saved",
        expect.any(String),
        3500,
      ),
    );
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("preserves edits made during POST and sends them as a PUT without losing focus", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    type(0, "09:30");
    const originalInput = input(0);
    await act(async () => pending.resolve({ data: { id: "report-1" } }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect((input(0) as HTMLInputElement).value).toBe("09:30");
    expect(input(0)).toBe(originalInput);
    expect(request.mock.calls[1][0]).toMatchObject({
      method: "PUT",
      data: { time_range: "09:30" },
    });
  });

  it("keeps Save All usable after saving even if refreshing report caches hangs", async () => {
    await setup();
    vi.spyOn(client, "invalidateQueries").mockReturnValue(
      new Promise(() => undefined),
    );
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect((saveAll() as HTMLButtonElement).disabled).toBe(false),
    );
    expect(saveAll().disabled).toBe(false);
    expect(toast.showSuccess).toHaveBeenCalled();
  });

  it("auto-saves changes to an already saved row", async () => {
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    type(0, "10:00");
    fireEvent.focus(input(1));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0]).toMatchObject({
      method: "PUT",
      data: { time_range: "10:00" },
    });
  });

  it("adds exactly one empty row when typing starts, and skips blank rows in Save All", async () => {
    await setup();
    expect(rows()).toHaveLength(1);
    type(0, "09:00");
    type(0, "09:30");
    expect(rows()).toHaveLength(2);
    fireEvent.click(saveAll());
    await waitFor(() => expect(toast.showSuccess).toHaveBeenCalled());
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data).not.toHaveProperty("clientId");
    expect(request.mock.calls[0][0].data).not.toHaveProperty("revision");
  });

  it("coalesces autosave and repeated Save All clicks into one POST", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    fireEvent.click(saveAll());
    fireEvent.focus(input(1));
    fireEvent.click(saveAll());
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(toast.showSuccess).not.toHaveBeenCalled();
    await act(async () => pending.resolve({ data: { id: "report-1" } }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(saveAll().disabled).toBe(false);
  });

  it("allows Save All to save another row while auto-save is pending", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, "09:00");
    type(1, "10:00");
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect((saveAll() as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0].data.time_range).toBe("10:00");
    await act(async () => pending.resolve({ data: { id: "report-2" } }));
  });

  it("unlocks a timed-out row and reuses its draft key, updating edits after a replayed POST", async () => {
    request.mockRejectedValueOnce(new Error("timeout"));
    await setup();
    type(0, "09:00");
    fireEvent.focus(input(1));
    await waitFor(() => expect(toast.showError).toHaveBeenCalled());
    expect((saveAll() as HTMLButtonElement).disabled).toBe(false);
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toContain("Not saved");
    type(0, "10:00");
    request.mockResolvedValueOnce({
      status: 200,
      data: { id: "report-1", time_range: "09:00" },
    });
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
    expect(request.mock.calls.map(([config]) => config.method)).toEqual([
      "POST",
      "POST",
      "PUT",
    ]);
    const keys = request.mock.calls.map(
      ([config]) => config.data.client_request_id,
    );
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toMatch(/^[a-f0-9-]{36}$/);
    expect(request.mock.calls[0][0].timeout).toBe(30000);
    expect(request.mock.calls[2][0].data.time_range).toBe("10:00");
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Saved");
  });

  it("preserves the correct row when another row is deleted during a POST", async () => {
    const stored = {
      id: "existing",
      date: new Date().toISOString().split("T")[0],
      time_range: "08:00",
      doctor_name: "",
      district: "",
      client_type: "doctor",
      new_client: false,
      orders: "",
      tel_orders: "",
      samples: "",
      new_product_intro: "",
      old_product_followup: "",
      delivery_time_update: "",
      salesman_name: "",
    };
    vi.mocked(axios.get).mockImplementation(async (url, config) => ({
      data: String(url).endsWith("/suggestions/")
        ? emptyReportSuggestions
        : config?.params?.date
          ? [stored]
          : [],
    }));
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(1, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    fireEvent.click(within(rows()[0]).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(rows()).toHaveLength(2));
    await act(async () => pending.resolve({ data: { id: "new-report" } }));
    expect((input(0) as HTMLInputElement).value).toBe("09:00");
    expect((input(1) as HTMLInputElement).value).toBe("");
    expect(rows()).toHaveLength(2);
    type(0, "09:30");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0].url).toContain("/new-report/");
  });

  it("does not put an old date's save response into the new date's row", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    const firstDate = request.mock.calls[0][0].data.date;
    fireEvent.click(screen.getByRole("button", { name: "Prev date" }));
    await screen.findByRole("button", { name: "Add New Entry" });
    fireEvent.click(screen.getByRole("button", { name: "Add New Entry" }));
    type(0, "10:00");
    await act(async () => pending.resolve({ data: { id: "old-date-report" } }));
    expect((input(0) as HTMLInputElement).value).toBe("10:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0]).toMatchObject({
      method: "POST",
      data: { time_range: "10:00" },
    });
    expect(request.mock.calls[1][0].data.date).not.toBe(firstDate);
  });

  it("keeps an edited saved row after failed auto-save and date navigation", async () => {
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    type(0, "10:00");
    request.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: "Prev date" }));
    await screen.findByRole("button", { name: "Next date" });
    await waitFor(() => expect(toast.showError).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Next date" }));
    await screen.findByRole("button", { name: "Add New Entry" });
    expect((input(0) as HTMLInputElement).value).toBe("10:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
    expect(request.mock.calls[2][0]).toMatchObject({
      method: "PUT",
      data: { time_range: "10:00" },
    });
  });

  it("treats a checked New Client field as data and auto-saves it", async () => {
    await setup();
    const checkbox = within(rows()[0]).getByRole("checkbox");
    fireEvent.focus(checkbox);
    fireEvent.click(checkbox);
    expect(rows()).toHaveLength(2);
    fireEvent.focus(input(1));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0][0].data.new_client).toBe(true);
  });

  it("keeps the single bottom Save All button enabled throughout a pending save and failure", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect((saveAll() as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveAll());
    expect(screen.getAllByRole("button", { name: "Save All" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(document.querySelector(".report-bottom")?.contains(saveAll())).toBe(
      true,
    );
    fireEvent.click(saveAll());
    expect(saveAll().disabled).toBe(false);
    await act(async () => pending.reject(new Error("offline")));
    expect(request).toHaveBeenCalledTimes(1);
    expect((saveAll() as HTMLButtonElement).disabled).toBe(false);
    expect(saveAll().disabled).toBe(false);
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("includes newly typed rows when Save All is clicked again during a pending batch", async () => {
    const first = deferred<{ data: { id: string } }>();
    const second = deferred<{ data: { id: string } }>();
    request
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    type(1, "10:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0].data.time_range).toBe("10:00");
    await act(async () => first.resolve({ data: { id: "first-report" } }));
    expect(toast.showSuccess).not.toHaveBeenCalled();
    await act(async () => second.resolve({ data: { id: "second-report" } }));
    expect(toast.showSuccess).toHaveBeenCalledExactlyOnceWith(
      "Reports Saved",
      "2 report entries were saved successfully.",
      3500,
    );
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("retries a failed row immediately with Save All while another row is still saving", async () => {
    const slow = deferred<{ data: { id: string } }>();
    request
      .mockReturnValueOnce(slow.promise)
      .mockRejectedValueOnce(new Error("offline"));
    await setup();
    type(0, "09:00");
    type(1, "10:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(toast.showError).toHaveBeenCalled());
    expect(request).toHaveBeenCalledTimes(2);
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
    expect(request.mock.calls[2][0].data.time_range).toBe("10:00");
    await act(async () => slow.resolve({ data: { id: "slow-report" } }));
    expect(toast.showSuccess).toHaveBeenCalledWith(
      "Reports Saved",
      "2 report entries were saved successfully.",
      3500,
    );
    expect(
      toast.showSuccess.mock.calls.filter(
        ([title]) => title === "Reports Saved",
      ),
    ).toHaveLength(1);
    expect(toast.showWarning).not.toHaveBeenCalled();
  });

  it("lets Save All on another date proceed while the previous date is still saving", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Prev date" }));
    await screen.findByRole("button", { name: "Add New Entry" });
    fireEvent.click(screen.getByRole("button", { name: "Add New Entry" }));
    type(0, "10:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(saveAll().textContent).toBe("Save All"));
    expect(request.mock.calls[1][0].data.date).not.toBe(
      request.mock.calls[0][0].data.date,
    );
    await act(async () => pending.resolve({ data: { id: "old-date-report" } }));
    expect(toast.showSuccess).toHaveBeenCalledTimes(2);
  });

  it("keeps the form and save controls usable while reports are loading", async () => {
    const loading = deferred<{ data: never[] }>();
    vi.mocked(axios.get).mockImplementation((url) =>
      String(url).endsWith("/suggestions/")
        ? Promise.resolve({ data: emptyReportSuggestions })
        : loading.promise,
    );
    await setup();
    type(0, "09:00");
    expect((saveAll() as HTMLButtonElement).disabled).toBe(false);
    expect(saveAll().disabled).toBe(false);
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    await act(async () => loading.resolve({ data: [] }));
    expect((input(0) as HTMLInputElement).value).toBe("09:00");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("confirms Save All when every entry is already saved without sending a duplicate request", async () => {
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    toast.showSuccess.mockClear();
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledExactlyOnceWith(
        "Reports Saved",
        "1 report entry was saved successfully.",
        3500,
      ),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("updates cached dashboard and client lists from save/delete responses without reloading history", async () => {
    await setup();
    const today = new Date().toISOString().split("T")[0];
    const keys = [
      reportKeys.all("tester"),
      reportKeys.day("tester", today),
      reportKeys.week("tester", today, today),
    ];
    keys.forEach((key) => client.setQueryData(key, []));
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    keys.forEach((key) =>
      expect(client.getQueryData(key)).toMatchObject([
        { id: "report-1", time_range: "09:00" },
      ]),
    );
    type(0, "10:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    keys.forEach((key) =>
      expect(client.getQueryData(key)).toMatchObject([
        { id: "report-1", time_range: "10:00" },
      ]),
    );
    fireEvent.click(within(rows()[0]).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(rows()).toHaveLength(1));
    keys.forEach((key) => expect(client.getQueryData(key)).toEqual([]));
    expect(axios.get).toHaveBeenCalledTimes(2); // one day + compact suggestions, no follow-up history GET
    expect(
      vi
        .mocked(axios.get)
        .mock.calls.every(
          ([url, config]) =>
            String(url).endsWith("/suggestions/") || !!config?.params?.date,
        ),
    ).toBe(true);
  });

  it("keeps the row and cached lists on a failed delete, then removes them after a retry", async () => {
    await setup();
    client.setQueryData(reportKeys.all("tester"), []);
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    vi.mocked(axios.delete).mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(within(rows()[0]).getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        "Deletion Failed",
        expect.any(String),
        6000,
      ),
    );
    expect(rows()).toHaveLength(2);
    expect(client.getQueryData(reportKeys.all("tester"))).toMatchObject([
      { id: "report-1" },
    ]);
    fireEvent.click(within(rows()[0]).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(client.getQueryData(reportKeys.all("tester"))).toEqual([]);
  });

  it("uses canonical saved values without changing a row identity", async () => {
    request.mockImplementationOnce(async (config) => ({
      data: { ...config.data, id: "report-1", time_range: "09:00" },
    }));
    await setup();
    type(0, " 09:00 ");
    const originalInput = input(0);
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    expect((input(0) as HTMLInputElement).value).toBe("09:00");
    expect(input(0)).toBe(originalInput);
  });

  it("autosaves the last row one second after typing stops, with one blank row and no focus change", async () => {
    await setup(true);
    vi.useFakeTimers();
    type(0, "09");
    const original = input(0);
    await act(async () => vi.advanceTimersByTimeAsync(700));
    type(0, "09:00");
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Waiting to autosave");
    expect(
      new ReportDraftStorage("https://example.test", "tester").read()[0]
        .time_range,
    ).toBe("09:00");
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(request).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data.time_range).toBe("09:00");
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Saved");
    expect(rows()).toHaveLength(2);
    expect(input(0)).toBe(original);
    expect(toast.showSuccess).not.toHaveBeenCalled();
    expect(
      new ReportDraftStorage("https://example.test", "tester").read(),
    ).toEqual([]);
  });

  it("acknowledges a manual save immediately with a steady enabled button and truthful status", async () => {
    const pending = deferred<{ data: { id: string } }>();
    request.mockReturnValueOnce(pending.promise);
    await setup();
    vi.useFakeTimers();
    type(0, "09:00");
    fireEvent.click(saveAll());
    expect(saveAll().textContent).toBe("Save All");
    expect((saveAll() as HTMLButtonElement).disabled).toBe(false);
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Saved on this device · Syncing...");
    expect(saveAll().textContent).toBe("Save All");
    expect(toast.showSuccess).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(request).toHaveBeenCalledTimes(1);
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Saved on this device · Syncing...");
    await act(async () => pending.resolve({ data: { id: "report-1" } }));
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Saved");
  });

  it("flushes on leaving the row, but not when moving between its fields", async () => {
    await setup();
    vi.useFakeTimers();
    type(0, "09:00");
    const nextField = within(rows()[0]).getAllByRole("textbox")[1];
    fireEvent.blur(input(0), { relatedTarget: nextField });
    await act(async () => undefined);
    expect(request).not.toHaveBeenCalled();
    fireEvent.blur(nextField, { relatedTarget: saveAll() });
    await act(async () => undefined);
    expect(request).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("waits for Chinese input composition to finish before starting the debounce", async () => {
    await setup();
    vi.useFakeTimers();
    fireEvent.compositionStart(input(0));
    type(0, "中");
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(request).not.toHaveBeenCalled();
    type(0, "中環");
    fireEvent.compositionEnd(input(0));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data.time_range).toBe("中環");
  });

  it("shows autosave failure, keeps the draft, and retries on reconnect without an automatic retry loop", async () => {
    request.mockRejectedValueOnce(new Error("offline"));
    await setup();
    vi.useFakeTimers();
    type(0, "09:00");
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toContain("Not saved");
    expect(
      new ReportDraftStorage("https://example.test", "tester").read(),
    ).toHaveLength(1);
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(request).toHaveBeenCalledTimes(1);
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(request).toHaveBeenCalledTimes(2);
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Saved");
    expect(request.mock.calls[1][0].data.client_request_id).toBe(
      request.mock.calls[0][0].data.client_request_id,
    );
    expect(
      new ReportDraftStorage("https://example.test", "tester").read(),
    ).toHaveLength(0);
  });

  it("recovers unfinished text after remount, cancels the old timer and waits for review", async () => {
    await setup();
    vi.useFakeTimers();
    type(0, "09:00");
    const savedKey = new ReportDraftStorage(
      "https://example.test",
      "tester",
    ).read()[0].client_request_id;
    cleanup();
    client.clear();
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(request).not.toHaveBeenCalled();
    vi.useRealTimers();
    await setup();
    expect((input(0) as HTMLInputElement).value).toBe("09:00");
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toContain("Recovered draft");
    vi.useFakeTimers();
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    fireEvent.focus(input(1));
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(saveAll());
    await act(async () => undefined);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].data.client_request_id).toBe(savedKey);
    expect(
      within(rows()[0]).getByRole("status").getAttribute("aria-label"),
    ).toBe("Saved");
  });

  it("retains recovery edits over a stale server read and resumes autosave on new typing", async () => {
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    type(0, "10:00");
    const draft = new ReportDraftStorage(
      "https://example.test",
      "tester",
    ).read()[0];
    cleanup();
    client.clear();
    request.mockClear();
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data: String(url).endsWith("/suggestions/")
        ? emptyReportSuggestions
        : [{ ...draft, time_range: "09:00" }],
    }));
    await setup();
    expect((input(0) as HTMLInputElement).value).toBe("10:00");
    vi.useFakeTimers();
    type(0, "11:00");
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toMatchObject({
      method: "PUT",
      data: { id: "report-1", time_range: "11:00" },
    });
  });

  it("continues saving when local draft storage is unavailable", async () => {
    await setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    type(0, "09:00");
    expect(screen.getByRole("alert").textContent).toContain(
      "Draft recovery is unavailable",
    );
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    expect((saveAll() as HTMLButtonElement).disabled).toBe(false);
  });

  it("saves intentional clearing of an existing entry but never creates blank entries", async () => {
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    vi.useFakeTimers();
    type(0, "");
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0]).toMatchObject({
      method: "PUT",
      data: { time_range: "" },
    });
    fireEvent.click(saveAll());
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not send an old editor replay PUT over a newer recovered edit after navigation", async () => {
    const oldRequest = deferred<{
      status: number;
      data: { id: string; time_range: string };
    }>();
    request.mockReturnValueOnce(oldRequest.promise);
    await setup();
    type(0, "09:00");
    fireEvent.click(saveAll());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    cleanup();
    client.clear();
    await setup();
    client.setQueryData(reportKeys.all("tester"), []);
    type(0, "10:00");
    request.mockResolvedValueOnce({
      status: 200,
      data: { id: "report-1", time_range: "09:00" },
    });
    fireEvent.click(saveAll());
    await waitFor(() =>
      expect(
        within(rows()[0]).getByRole("status").getAttribute("aria-label"),
      ).toBe("Saved"),
    );
    expect(request).toHaveBeenCalledTimes(3);
    await act(async () =>
      oldRequest.resolve({
        status: 200,
        data: { id: "report-1", time_range: "09:00" },
      }),
    );
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[2][0]).toMatchObject({
      method: "PUT",
      data: { time_range: "10:00" },
    });
    expect(client.getQueryData(reportKeys.all("tester"))).toMatchObject([
      { time_range: "10:00" },
    ]);
    expect(
      new ReportDraftStorage("https://example.test", "tester").read(),
    ).toEqual([]);
  });

  it("keeps ordinary arrow keys for editing and reserves Alt+Arrow for entry navigation", async () => {
    await setup();
    type(0, "09:00");
    const plain = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(input(0), plain);
    expect(plain.defaultPrevented).toBe(false);
    const shortcut = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(input(0), shortcut);
    expect(shortcut.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input(1));
  });
});
