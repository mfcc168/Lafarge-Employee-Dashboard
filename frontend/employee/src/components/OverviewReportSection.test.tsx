import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OverviewReportSection, {
  type OverviewMode,
  type OverviewReportSectionProps,
} from "./OverviewReportSection";
import type { ReportEntry } from "@interfaces/index";

const auth = vi.hoisted(() => ({
  user: { firstname: "Ho Yeung", lastname: "Cheung", role: "ADMIN" },
}));
vi.mock("@context/AuthContext", () => ({ useAuth: () => auth }));
const alex: ReportEntry = {
  id: "1",
  date: "2026-10-08",
  time_range: "0900-1000",
  district: "Central",
  doctor_name: "Dr. Chan",
  client_type: "doctor",
  new_client: true,
  salesman_name: "Ho Yeung Cheung",
  orders: "Vitamin C · 24 boxes",
  tel_orders: "Telephone order",
  samples: "Starter sample",
  new_product_intro: "New product discussion",
  old_product_followup: "Follow up",
  delivery_time_update: "Delivery tomorrow",
};
const dominic = {
  ...alex,
  id: "2",
  salesman_name: "Hung Ki So",
  doctor_name: "Dr. Lee",
  samples: "Second sample",
};
const props: OverviewReportSectionProps = {
  mode: "daily",
  entries: [alex, dominic],
  period: "8 Oct 2026",
  isLoading: false,
  hasData: true,
};
const table = () => within(screen.getByRole("table"));
beforeEach(() => {
  auth.user.role = "ADMIN";
});
afterEach(cleanup);

describe("Overview report scope and interaction", () => {
  it("limits all three sections to the signed-in salesperson", () => {
    auth.user.role = "SALESMAN";
    for (const mode of ["daily", "samples", "new-clients"] as OverviewMode[]) {
      render(<OverviewReportSection {...props} mode={mode} />);
      expect(table().getByText("Dr. Chan")).toBeTruthy();
      expect(screen.queryByText("Dr. Lee")).toBeNull();
      expect(screen.queryByRole("combobox")).toBeNull();
      cleanup();
    }
  });
  it.each(["samples", "new-clients"] as const)(
    "falls back to an available salesperson when %s data changes",
    (mode) => {
      const result = render(<OverviewReportSection {...props} mode={mode} />);
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: dominic.salesman_name },
      });
      expect(table().getByText("Dr. Lee")).toBeTruthy();
      result.rerender(
        <OverviewReportSection
          {...props}
          mode={mode}
          entries={[alex]}
          period="Earlier week"
        />,
      );
      expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
        alex.salesman_name,
      );
      expect(table().getByText("Dr. Chan")).toBeTruthy();
    },
  );
  it("preserves a valid salesperson selection during refreshes", () => {
    const result = render(<OverviewReportSection {...props} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: dominic.salesman_name },
    });
    result.rerender(
      <OverviewReportSection
        {...props}
        entries={[{ ...alex }, { ...dominic, orders: "Refreshed order" }]}
        isFetching
      />,
    );
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
      dominic.salesman_name,
    );
    expect(table().getByText("Refreshed order")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "Updating daily reports…",
    );
  });
  it("gives clerks a reversible completion control and hides discussion fields", () => {
    auth.user.role = "CLERK";
    const noActivity = {
      ...alex,
      id: "3",
      doctor_name: "Discussion only",
      orders: "",
      samples: "",
      tel_orders: "",
    };
    const result = render(
      <OverviewReportSection {...props} entries={[alex, noActivity]} />,
    );
    expect(table().getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.queryByText("Discussion only")).toBeNull();
    expect(screen.queryByText("New product discussion")).toBeNull();
    fireEvent.click(table().getByRole("button", { name: /as completed$/ }));
    expect(
      table()
        .getByRole("button", { name: /as incomplete$/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    result.rerender(
      <OverviewReportSection {...props} entries={[{ ...alex }]} isFetching />,
    );
    expect(
      table()
        .getByRole("button", { name: /as incomplete$/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(table().getByRole("button", { name: /as incomplete$/ }));
    expect(
      table()
        .getByRole("button", { name: /as completed$/ })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });
  it("shows an accurate empty state when limited users have no orders or samples", () => {
    auth.user.role = "DELIVERYMAN";
    render(
      <OverviewReportSection
        {...props}
        entries={[{ ...alex, orders: "", tel_orders: "", samples: "  " }]}
      />,
    );
    expect(
      table().getByText("No orders or samples for this date"),
    ).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
  it("distinguishes initial load errors from a valid empty result and permits retry", () => {
    const retry = vi.fn();
    render(
      <OverviewReportSection
        {...props}
        entries={[]}
        isError
        hasData={false}
        onRetry={retry}
      />,
    );
    expect(table().getByText("Daily reports couldn’t be loaded.")).toBeTruthy();
    expect(screen.queryByText("No reports for this date")).toBeNull();
    fireEvent.click(table().getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it("keeps cached records visible after a failed refresh", () => {
    const retry = vi.fn();
    render(<OverviewReportSection {...props} isError onRetry={retry} />);
    expect(table().getByText("Dr. Chan")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain(
      "Showing your previous results.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
