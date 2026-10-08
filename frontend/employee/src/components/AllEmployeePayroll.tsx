import { useId, useState } from "react";
import PayrollInformation from "./PayrollInformation";
import { useAllEmployeePayroll } from "@hooks/useAllEmployeePayroll";
import { ChevronDown, LoaderCircle, Printer } from "lucide-react";
import LoadingSpinner from "@components/LoadingSpinner";
import DisclosurePanel from "@components/DisclosurePanel";
import SearchField from "@components/SearchField";
import { formatAmount } from "@utils/formatAmount";

export default function AllEmployeePayroll() {
  const id = useId();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState("");
  const {
    user,
    profiles,
    expandedId,
    isLoading,
    isFetching,
    isError,
    hasData,
    refetch,
    year,
    month,
    commissions,
    toggleExpand,
    handleViewPayrollPDF,
  } = useAllEmployeePayroll();

  if (
    !user ||
    !["MANAGER", "ADMIN", "CEO", "DIRECTOR"].includes(user.role || "")
  ) {
    return (
      <div className="people-panel people-empty">
        <h2>Payroll access is restricted</h2>
        <p>You do not have permission to view all employee payrolls.</p>
      </div>
    );
  }
  if (isLoading)
    return (
      <div className="people-panel">
        <LoadingSpinner message="Loading payroll…" />
      </div>
    );
  if (!hasData) {
    return (
      <div className="people-panel people-empty" role="alert">
        <h2>Payroll couldn’t be loaded</h2>
        <p>Please try again.</p>
        <button
          className="button button-quiet"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  const payrolls = profiles.map((profile) => {
    const salaryData = {
      baseSalary: parseFloat(profile.base_salary),
      bonusPayment: parseFloat(profile.bonus_payment),
      yearEndBonus: parseFloat(profile.year_end_bonus),
      transportationAllowance: parseFloat(profile.transportation_allowance),
      commission: commissions[profile.user.username] || 0,
      mpfDeduction: profile.is_mpf_exempt ? 0 : 0.05,
    };
    const grossPayment =
      salaryData.baseSalary +
      salaryData.bonusPayment +
      salaryData.yearEndBonus +
      (salaryData.transportationAllowance || 0) +
      (salaryData.commission || 0);
    const mpfDeductionAmount = Math.min(
      1500,
      grossPayment * salaryData.mpfDeduction,
    );
    return {
      profile,
      salaryData,
      grossPayment,
      mpfDeductionAmount,
      netPayment: grossPayment - mpfDeductionAmount,
    };
  });
  const active = payrolls.filter(({ profile }) => profile.is_active);
  const totalNetPayroll = active.reduce(
    (sum, entry) => sum + entry.netPayment,
    0,
  );
  const period = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const needle = search.trim().toLowerCase();
  const visible = payrolls.filter(({ profile }) => {
    const matchesStatus =
      status === "all" ||
      (status === "active" ? profile.is_active : !profile.is_active);
    return (
      matchesStatus &&
      `${profile.user.first_name} ${profile.user.last_name} ${profile.user.username} ${profile.role}`
        .toLowerCase()
        .includes(needle)
    );
  });
  const visibleIds = new Set(visible.map(({ profile }) => profile.id));

  const printPayslips = async () => {
    if (isPrinting) return;
    setPrintError("");
    setIsPrinting(true);
    try {
      await handleViewPayrollPDF();
    } catch (error) {
      setPrintError(
        error instanceof Error
          ? error.message
          : "Payslips couldn’t be generated. Please try again.",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <section
      className="people-panel payroll-panel"
      aria-label="Employee payroll"
    >
      <div className="payroll-summary">
        <div>
          <p className="finance-caption">Total net payroll · {period}</p>
          <p className="payroll-total">{formatAmount(totalNetPayroll)}</p>
          <p className="finance-caption">
            For {active.length} active{" "}
            {active.length === 1 ? "employee" : "employees"}
          </p>
        </div>
        <dl className="payroll-team-count">
          <dt>Employees</dt>
          <dd>{profiles.length}</dd>
        </dl>
      </div>
      {isError && (
        <div className="people-inline-message" role="alert">
          The latest payroll couldn’t be loaded. Showing your previous results.
          <button
            className="button button-quiet"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      )}
      <header className="finance-section-heading payroll-list-title">
        <h2>Employee payslips</h2>
        <button
          type="button"
          className="button payroll-print"
          disabled={isPrinting || !profiles.length || isError}
          onClick={() => void printPayslips()}
          aria-label="Print all payslips"
          title="Print all payslips"
        >
          {isPrinting ? (
            <LoaderCircle
              size={18}
              className="finance-working-icon"
              aria-hidden="true"
            />
          ) : (
            <Printer size={18} aria-hidden="true" />
          )}
          <span>Print all</span>
        </button>
      </header>
      {isPrinting && (
        <p className="finance-caption" role="status">
          Preparing payslips…
        </p>
      )}
      {printError && (
        <div className="people-inline-message" role="alert">
          {printError}
          <button
            type="button"
            className="button button-quiet"
            onClick={() => void printPayslips()}
            disabled={isPrinting}
          >
            Try again
          </button>
        </div>
      )}
      <div className="payroll-toolbar">
        <SearchField
          id={`${id}-search`}
          label="Search payroll"
          placeholder="Name or role"
          value={search}
          onValueChange={setSearch}
          clearLabel="Clear payroll search"
          className="payroll-search-field"
        />
        <div className="workspace-field payroll-status-field">
          <label htmlFor={`${id}-status`}>Employee status</label>
          <div className="workspace-select">
            <select
              className="workspace-input"
              id={`${id}-status`}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All employees</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="finance-list-heading">
        <p className="finance-caption" aria-live="polite" aria-atomic="true">
          Showing {visible.length} of {profiles.length}{" "}
          {profiles.length === 1 ? "employee" : "employees"}
        </p>
        {isFetching && (
          <span className="finance-caption" role="status">
            Updating payroll…
          </span>
        )}
      </div>
      <div className="finance-records payroll-records">
        {payrolls.map(
          ({
            profile,
            salaryData,
            grossPayment,
            mpfDeductionAmount,
            netPayment,
          }) => {
            const expanded = expandedId === profile.id,
              panelId = `${id}-employee-${profile.id}`;
            const name =
              `${profile.user.first_name} ${profile.user.last_name}`.trim() ||
              profile.user.username;
            const role =
              profile.role.length > 3
                ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase()
                : profile.role;
            return (
              <div
                key={profile.id}
                className="finance-record"
                hidden={!visibleIds.has(profile.id)}
              >
                <button
                  type="button"
                  className="finance-row payroll-employee-toggle"
                  onClick={() => toggleExpand(profile.id)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                >
                  <span className="finance-row-identity">
                    <span className="finance-row-icon" aria-hidden="true">
                      {profile.user.first_name.charAt(0) +
                        profile.user.last_name.charAt(0) ||
                        profile.user.username.charAt(0)}
                    </span>
                    <span>
                      <span className="finance-row-title">{name}</span>
                      <span className="finance-caption">
                        {role}
                        {!profile.is_active && (
                          <span className="payroll-inactive">Inactive</span>
                        )}
                      </span>
                    </span>
                  </span>
                  <span className="finance-row-value">
                    <span className="finance-caption">Net pay</span>
                    {formatAmount(netPayment)}
                  </span>
                  <ChevronDown
                    size={18}
                    className="finance-chevron"
                    aria-hidden="true"
                  />
                </button>
                <DisclosurePanel id={panelId} expanded={expanded}>
                  <div className="payroll-breakdown">
                    <PayrollInformation
                      salaryData={salaryData}
                      grossPayment={grossPayment}
                      netPayment={netPayment}
                      mpfDeductionAmount={mpfDeductionAmount}
                      year={year}
                      month={month}
                      userRole={profile.role}
                      employeeId={profile.id}
                    />
                  </div>
                </DisclosurePanel>
              </div>
            );
          },
        )}
      </div>
      {!visible.length && (
        <div className="people-empty">
          <h3>
            {profiles.length ? "No matching employees" : "No employees yet"}
          </h3>
          {profiles.length ? (
            <>
              <p>Try another name, role or status.</p>
              <button
                className="button button-quiet"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                  document.getElementById(`${id}-search`)?.focus();
                }}
              >
                Clear filters
              </button>
            </>
          ) : (
            <p>Employee payslips will appear here.</p>
          )}
        </div>
      )}
    </section>
  );
}
