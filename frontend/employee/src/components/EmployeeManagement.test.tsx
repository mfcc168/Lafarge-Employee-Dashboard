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
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import EmployeeManagement from "./EmployeeManagement";
import type { EmployeeProfile } from "@interfaces/EmployeeType";

const auth = vi.hoisted(() => ({ role: "ADMIN" }));
vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "test-token", user: { role: auth.role } }),
}));
vi.mock("@configs/DotEnv", () => ({ backendUrl: "https://example.test" }));
vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const alex: EmployeeProfile = {
  id: 1,
  user: {
    id: 1,
    first_name: "Alex",
    last_name: "Cheung",
    username: "alex",
    email: "alex@example.test",
  },
  role: "SALESMAN",
  base_salary: "22000.00",
  transportation_allowance: "800.00",
  bonus_payment: "0.00",
  year_end_bonus: "0.00",
  annual_leave_days: 14,
  employment_date: "2024-01-15",
  is_mpf_exempt: false,
  is_active: true,
};
const employeeList = [
  alex,
  {
    ...alex,
    id: 2,
    user: {
      ...alex.user,
      id: 2,
      first_name: "Mia",
      last_name: "Lam",
      username: "mia",
      email: "mia@example.test",
    },
    role: "CLERK",
    is_active: false,
  },
  { ...alex, id: 3, role: "DIRECTOR" },
];
const clients: QueryClient[] = [];
function setup(cached = true) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  if (cached)
    client.setQueryData(["all-employees", "test-token"], employeeList);
  client.setQueryData(["employee-salaries", "test-token"], employeeList);
  client.setQueryData(["employee", "1"], alex);
  client.setQueryData(["all-employees", "other-token"], employeeList);
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <EmployeeManagement />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return client;
}
const rows = () => within(screen.getByRole("list"));
beforeEach(() => {
  vi.resetAllMocks();
  auth.role = "ADMIN";
  vi.mocked(axios.get).mockResolvedValue({ data: employeeList });
  vi.mocked(axios.post).mockResolvedValue({ data: { is_active: false } });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
});

describe("employee directory interactions", () => {
  it("searches trimmed full names and emails, preserves the status filter and excludes management profiles", () => {
    setup();
    expect(rows().getAllByRole("listitem")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Search employees"), {
      target: { value: "  Alex Cheung  " },
    });
    expect(rows().getAllByRole("listitem")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Search employees"), {
      target: { value: "MIA@EXAMPLE.TEST" },
    });
    expect(rows().getByText("Mia Lam")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Active 1" }));
    expect(screen.getByText("No matching employees")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Clear employee search" }),
    );
    expect(rows().getByText("Alex Cheung")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByLabelText("Search employees"),
    );
    expect(
      screen
        .getByRole("button", { name: "Active 1" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
  it("shows progress on one row, allows another account action and prevents a duplicate toggle", async () => {
    let resolve!: (value: { data: { is_active: boolean } }) => void;
    vi.mocked(axios.post)
      .mockReturnValueOnce(
        new Promise((r) => {
          resolve = r;
        }),
      )
      .mockResolvedValueOnce({ data: { is_active: true } });
    setup();
    const deactivate = screen.getByRole("button", {
      name: "Deactivate Alex Cheung",
    });
    fireEvent.click(deactivate);
    fireEvent.click(deactivate);
    await screen.findByText("Updating…");
    expect(axios.post).toHaveBeenCalledTimes(1);
    const activate = screen.getByRole("button", { name: "Activate Mia Lam" });
    expect((activate as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(activate);
    await screen.findByText("Mia Lam activated.");
    await act(async () => {
      resolve({ data: { is_active: false } });
    });
    await screen.findByText("Alex Cheung deactivated.");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
  it("uses confirmed status and cancels older reads before updating current-user list, salary and profile caches", async () => {
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    // The server can report unchanged status; never infer success by inverting local data.
    vi.mocked(axios.post).mockResolvedValue({ data: { is_active: true } });
    const client = setup();
    let signal!: AbortSignal;
    vi.mocked(axios.get).mockImplementation((_url, config) => {
      signal = config!.signal as AbortSignal;
      return new Promise(() => {});
    });
    void client.invalidateQueries({
      queryKey: ["all-employees", "test-token"],
      exact: true,
    });
    await waitFor(() => expect(signal).toBeTruthy());
    const oldSignal = signal;
    fireEvent.click(
      screen.getByRole("button", { name: "Deactivate Alex Cheung" }),
    );
    await screen.findByText("Alex Cheung activated.");
    await waitFor(() => expect(oldSignal.aborted).toBe(true));
    expect(
      client.getQueryData<EmployeeProfile[]>([
        "all-employees",
        "test-token",
      ])![0].is_active,
    ).toBe(true);
    expect(
      client.getQueryData<EmployeeProfile>(["employee", "1"])!.is_active,
    ).toBe(true);
    // Now a real deactivation is reflected immediately before any refetch can finish.
    vi.mocked(axios.post).mockResolvedValue({ data: { is_active: false } });
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Deactivate Alex Cheung",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Deactivate Alex Cheung" }),
    );
    await screen.findByText("Alex Cheung deactivated.");
    await waitFor(() =>
      expect(
        client.getQueryData<EmployeeProfile[]>([
          "employee-salaries",
          "test-token",
        ])![0].is_active,
      ).toBe(false),
    );
    expect(
      client.getQueryData<EmployeeProfile>(["employee", "1"])!.is_active,
    ).toBe(false);
    expect(
      client.getQueryData<EmployeeProfile[]>([
        "all-employees",
        "other-token",
      ])![0].is_active,
    ).toBe(true);
    expect(
      client.getQueryData<EmployeeProfile[]>([
        "all-employees",
        "test-token",
      ])![1],
    ).toEqual(employeeList[1]);
  });
  it("keeps failed status changes visible and supports retry without false confirmation", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("Unavailable"));
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    const client = setup();
    fireEvent.click(
      screen.getByRole("button", { name: "Deactivate Alex Cheung" }),
    );
    await screen.findByRole("alert");
    expect(
      client.getQueryData<EmployeeProfile[]>([
        "all-employees",
        "test-token",
      ])![0].is_active,
    ).toBe(true);
    expect(screen.queryByText("Alex Cheung deactivated.")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Deactivate Alex Cheung" }),
    );
    await screen.findByText("Alex Cheung deactivated.");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
  it("restores focus to the selected filter when an acknowledged status change removes its row", async () => {
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    setup();
    const active = screen.getByRole("button", { name: "Active 1" });
    fireEvent.click(active);
    const button = screen.getByRole("button", {
      name: "Deactivate Alex Cheung",
    });
    button.focus();
    fireEvent.click(button);
    // Browsers can blur a focused action when it becomes disabled.
    button.blur();
    await screen.findByText("Alex Cheung deactivated.");
    await waitFor(() => expect(screen.queryByText("Alex Cheung")).toBeNull());
    expect(document.activeElement).toBe(active);
    expect(active.getAttribute("aria-pressed")).toBe("true");
  });
  it("does not steal focus if the user moves to another control during a status change", async () => {
    let resolve!: (value: { data: { is_active: boolean } }) => void;
    vi.mocked(axios.post).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Active 1" }));
    const button = screen.getByRole("button", {
      name: "Deactivate Alex Cheung",
    });
    button.focus();
    fireEvent.click(button);
    const search = screen.getByLabelText("Search employees");
    search.focus();
    await act(async () => {
      resolve({ data: { is_active: false } });
    });
    await screen.findByText("Alex Cheung deactivated.");
    await waitFor(() => expect(screen.queryByText("Alex Cheung")).toBeNull());
    expect(document.activeElement).toBe(search);
  });
  it("retains cached employees on refresh failure and provides a successful retry", async () => {
    const client = setup();
    vi.mocked(axios.get).mockRejectedValueOnce(new Error("Unavailable"));
    await act(async () => {
      await client.invalidateQueries({
        queryKey: ["all-employees", "test-token"],
        exact: true,
      });
    });
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Showing your previous results",
    );
    expect(rows().getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
  it("preserves CEO account management without offering restricted profile links", () => {
    auth.role = "CEO";
    setup();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Deactivate Alex Cheung" }),
    ).toBeTruthy();
  });
  it("does not fetch or expose employees to an unauthorized role", () => {
    auth.role = "MANAGER";
    setup(false);
    expect(screen.getByText("Access denied")).toBeTruthy();
    expect(axios.get).not.toHaveBeenCalled();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
