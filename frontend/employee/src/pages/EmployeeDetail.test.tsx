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
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import EmployeeDetail from "./EmployeeDetail";
import type { EmployeeProfile } from "@interfaces/EmployeeType";

const auth = vi.hoisted(() => ({ role: "ADMIN" }));
vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "test-token", user: { role: auth.role } }),
}));
vi.mock("@configs/DotEnv", () => ({ backendUrl: "https://example.test" }));
vi.mock("axios", () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
const employee: EmployeeProfile = {
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
  annual_leave_days: 0,
  employment_date: "2024-01-15",
  is_mpf_exempt: false,
  is_active: true,
};
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  client.setQueryData(["employee", "1"], employee);
  client.setQueryData(
    ["all-employees", "test-token"],
    [employee, { ...employee, id: 2 }],
  );
  client.setQueryData(["employee-salaries", "test-token"], [employee]);
  render(
    <MemoryRouter initialEntries={["/employees/1"]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/employees/:id" element={<EmployeeDetail />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return client;
}
const edit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
beforeEach(() => {
  vi.resetAllMocks();
  auth.role = "ADMIN";
  vi.mocked(axios.get).mockResolvedValue({ data: employee });
  vi.mocked(axios.patch).mockResolvedValue({
    data: { ...employee, base_salary: "23000.50" },
  });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
});

describe("employee profile editing", () => {
  it("shows readable profile values, including zero amounts and a stable employment date", () => {
    setup();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.getByText("15 Jan 2024")).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: "Compensation" })).getAllByText(
        "$0.00",
      ),
    ).toHaveLength(2);
    edit();
    expect(
      (screen.getByLabelText("Annual leave days") as HTMLInputElement).value,
    ).toBe("0");
    expect(document.activeElement).toBe(screen.getByLabelText("Role"));
  });
  it("starts from the latest profile and keeps an in-progress draft through background refreshes", async () => {
    const client = setup();
    act(() => {
      client.setQueryData(["employee", "1"], {
        ...employee,
        base_salary: "24000.00",
      });
    });
    await screen.findByText("$24,000.00");
    edit();
    expect(
      (screen.getByLabelText("Base salary") as HTMLInputElement).value,
    ).toBe("24000.00");
    fireEvent.change(screen.getByLabelText("Base salary"), {
      target: { value: "25000.50" },
    });
    vi.mocked(axios.get).mockResolvedValue({
      data: { ...employee, base_salary: "26000.00" },
    });
    await act(async () => {
      await client.invalidateQueries({
        queryKey: ["employee", "1"],
        exact: true,
      });
    });
    expect(
      (screen.getByLabelText("Base salary") as HTMLInputElement).value,
    ).toBe("25000.50");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Edit profile" }),
    );
    await screen.findByText("$26,000.00");
    edit();
    expect(
      (screen.getByLabelText("Base salary") as HTMLInputElement).value,
    ).toBe("26000.00");
    expect(axios.patch).not.toHaveBeenCalled();
  });
  it("does not duplicate or falsely confirm a pending save, then updates confirmed caches without waiting for refetch", async () => {
    let resolve!: (value: { data: EmployeeProfile }) => void;
    vi.mocked(axios.patch).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    const client = setup();
    edit();
    const form = screen.getByLabelText("Base salary").closest("form")!;
    fireEvent.change(screen.getByLabelText("Base salary"), {
      target: { value: "23000.50" },
    });
    fireEvent.submit(form);
    fireEvent.submit(form);
    await screen.findByText("Saving changes…");
    expect(axios.patch).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.queryByText("Changes saved")).toBeNull();
    expect(
      client.getQueryData<EmployeeProfile>(["employee", "1"])!.base_salary,
    ).toBe("22000.00");
    await act(async () => {
      resolve({ data: { ...employee, base_salary: "23000.50" } });
    });
    await screen.findByText("Changes saved");
    expect(
      client.getQueryData<EmployeeProfile>(["employee", "1"])!.base_salary,
    ).toBe("23000.50");
    expect(
      client.getQueryData<EmployeeProfile[]>([
        "employee-salaries",
        "test-token",
      ])![0].base_salary,
    ).toBe("23000.50");
    const directory = client.getQueryData<EmployeeProfile[]>([
      "all-employees",
      "test-token",
    ])!;
    expect(directory[0].base_salary).toBe("23000.50");
    expect(directory[1].base_salary).toBe("22000.00");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Edit profile" }),
    );
  });
  it("retains failed edits and supports a successful retry", async () => {
    vi.mocked(axios.patch).mockRejectedValueOnce(new Error("Unavailable"));
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    setup();
    edit();
    fireEvent.change(screen.getByLabelText("Base salary"), {
      target: { value: "23000.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("alert");
    expect(
      (screen.getByLabelText("Base salary") as HTMLInputElement).value,
    ).toBe("23000.50");
    expect(screen.queryByText("Changes saved")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Changes saved");
    expect(axios.patch).toHaveBeenCalledTimes(2);
  });
  it("preserves the editable field payload, including decimals, half days, an unset date, role and MPF", async () => {
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    setup();
    edit();
    fireEvent.change(screen.getByLabelText("Base salary"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Transportation allowance"), {
      target: { value: "800.50" },
    });
    fireEvent.change(screen.getByLabelText("Annual leave days"), {
      target: { value: "7.5" },
    });
    fireEvent.change(screen.getByLabelText("Employment date"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "CLERK" },
    });
    fireEvent.click(screen.getByLabelText("MPF exempt"));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Changes saved");
    expect(vi.mocked(axios.patch).mock.calls[0][1]).toEqual({
      base_salary: "0",
      transportation_allowance: "800.50",
      bonus_payment: "0.00",
      year_end_bonus: "0.00",
      annual_leave_days: "7.5",
      employment_date: null,
      role: "CLERK",
      is_mpf_exempt: true,
    });
  });
  it("retains cached details and an edit draft on refresh failure, with retry", async () => {
    const client = setup();
    edit();
    fireEvent.change(screen.getByLabelText("Annual leave days"), {
      target: { value: "7.5" },
    });
    vi.mocked(axios.get).mockRejectedValueOnce(new Error("Unavailable"));
    await act(async () => {
      await client.invalidateQueries({
        queryKey: ["employee", "1"],
        exact: true,
      });
    });
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Showing your previous details",
    );
    expect(
      (screen.getByLabelText("Annual leave days") as HTMLInputElement).value,
    ).toBe("7.5");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(
      (screen.getByLabelText("Annual leave days") as HTMLInputElement).value,
    ).toBe("7.5");
  });
  it("keeps the existing profile permissions for directors and CEOs", () => {
    auth.role = "DIRECTOR";
    setup();
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeTruthy();
    cleanup();
    auth.role = "CEO";
    setup();
    expect(screen.getByText("Access denied")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit profile" })).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.patch).not.toHaveBeenCalled();
  });
});
