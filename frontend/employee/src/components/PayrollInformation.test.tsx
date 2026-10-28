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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import PayrollInformation from "./PayrollInformation";
import type {
  EmployeeProfile,
  PayrollInformationProps,
} from "@interfaces/index";

vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "test-token" }),
}));
vi.mock("@configs/DotEnv", () => ({ backendUrl: "https://example.test" }));
vi.mock("axios", () => ({ default: { patch: vi.fn() } }));
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
  base_salary: "22000",
  bonus_payment: "1200",
  year_end_bonus: "0",
  transportation_allowance: "800",
  is_mpf_exempt: false,
  is_active: true,
  annual_leave_days: 14,
};
const props: PayrollInformationProps = {
  employeeId: 1,
  userRole: "SALESMAN",
  year: 2026,
  month: 9,
  salaryData: {
    baseSalary: 22000,
    bonusPayment: 1200,
    yearEndBonus: 0,
    transportationAllowance: 800,
    commission: 1000,
    mpfDeduction: 0.05,
  },
  grossPayment: 25000,
  mpfDeductionAmount: 1250,
  netPayment: 23750,
};

function setup(initial = props) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(
    ["employee-salaries", "test-token"],
    [employee, { ...employee, id: 2 }],
  );
  const view = (value: PayrollInformationProps) => (
    <QueryClientProvider client={client}>
      <PayrollInformation {...value} />
    </QueryClientProvider>
  );
  const result = render(view(initial));
  return {
    client,
    ...result,
    update: (value: PayrollInformationProps) => result.rerender(view(value)),
  };
}
const edit = () =>
  fireEvent.click(
    screen.getByRole("button", { name: "Edit payroll information" }),
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(axios.patch).mockResolvedValue({
    data: { ...employee, base_salary: "23000.50" },
  });
});
afterEach(cleanup);

describe("payroll editing feedback", () => {
  it("shows refreshed values and starts the next edit from the latest salary", () => {
    const { update } = setup();
    update({
      ...props,
      salaryData: { ...props.salaryData, baseSalary: 24000 },
    });
    expect(
      within(
        screen.getByRole("region", { name: "Salary components" }),
      ).getByText("$24,000.00"),
    ).toBeTruthy();
    edit();
    expect(
      (screen.getByLabelText("Base salary") as HTMLInputElement).value,
    ).toBe("24000");
  });
  it("accepts cleared and decimal amounts and updates only the confirmed employee cache", async () => {
    const { client } = setup();
    edit();
    const field = screen.getByLabelText("Base salary") as HTMLInputElement;
    fireEvent.change(field, { target: { value: "" } });
    expect(field.value).toBe("");
    fireEvent.change(field, { target: { value: "23000.50" } });
    fireEvent.submit(field.closest("form")!);
    await screen.findByText("Changes saved");
    expect(vi.mocked(axios.patch).mock.calls[0][1]).toEqual({
      base_salary: 23000.5,
      bonus_payment: 1200,
      year_end_bonus: 0,
      transportation_allowance: 800,
      commission: 1000,
    });
    const cache = client.getQueryData<EmployeeProfile[]>([
      "employee-salaries",
      "test-token",
    ])!;
    expect(cache[0].base_salary).toBe("23000.50");
    expect(cache[1].base_salary).toBe("22000");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Edit payroll information" }),
    );
  });
  it("does not confirm or duplicate a salary change while the request is pending", async () => {
    let resolve!: (value: { data: EmployeeProfile }) => void;
    vi.mocked(axios.patch).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { client } = setup();
    edit();
    const form = screen.getByLabelText("Base salary").closest("form")!;
    fireEvent.submit(form);
    await screen.findByText("Saving changes…");
    fireEvent.submit(form);
    expect(axios.patch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Changes saved")).toBeNull();
    expect(
      client.getQueryData<EmployeeProfile[]>([
        "employee-salaries",
        "test-token",
      ])![0].base_salary,
    ).toBe("22000");
    await act(async () => {
      resolve({ data: employee });
    });
    await screen.findByText("Changes saved");
  });
  it("keeps edits visible after a failed save and allows a successful retry", async () => {
    vi.mocked(axios.patch).mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
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
  it("previews the existing capped MPF calculation and keeps commission read-only", () => {
    setup();
    edit();
    fireEvent.change(screen.getByLabelText("Base salary"), {
      target: { value: "30000" },
    });
    const summary = within(
      screen.getByRole("region", { name: "Payment summary" }),
    );
    expect(summary.getByText("$33,000.00")).toBeTruthy();
    expect(summary.getByText("−$1,500.00")).toBeTruthy();
    expect(summary.getByText("$31,500.00")).toBeTruthy();
    expect(screen.getAllByRole("spinbutton")).toHaveLength(4);
  });
  it("cancels without writing and restores focus to Edit", () => {
    setup();
    edit();
    fireEvent.change(screen.getByLabelText("Base salary"), {
      target: { value: "90000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(axios.patch).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Edit payroll information" }),
    );
    edit();
    expect(
      (screen.getByLabelText("Base salary") as HTMLInputElement).value,
    ).toBe("22000");
  });
  it("retains the non-salesperson payload without commission", async () => {
    setup({
      ...props,
      userRole: "CLERK",
      salaryData: { ...props.salaryData, commission: 0 },
    });
    edit();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Changes saved");
    await waitFor(() =>
      expect(vi.mocked(axios.patch).mock.calls[0][1]).not.toHaveProperty(
        "commission",
      ),
    );
  });
});
