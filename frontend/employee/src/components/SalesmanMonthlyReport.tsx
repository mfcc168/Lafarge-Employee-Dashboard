import { useId } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UsersRound,
} from "lucide-react";
import LoadingSpinner from "@components/LoadingSpinner";
import DisclosurePanel from "@components/DisclosurePanel";
import SalesInvoiceList from "@components/SalesInvoiceList";
import { useSalesmanMonthlyReport } from "@hooks/useSalesmanMonthlyReport";
import type { SalesmanMonthlyReportProps } from "@interfaces/index";
import { formatAmount } from "@utils/formatAmount";

const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const rateFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export default function SalesmanMonthlyReport({
  salesmanName,
}: SalesmanMonthlyReportProps) {
  const id = useId();
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    expandedWeek,
    currentPage,
    invoicesPerPage,
    currentDate,
    canGoPrevious,
    canGoNext,
    sharedExpanded,
    toggleSharedExpanded,
    navigateMonth,
    paginateInvoices,
    handleNextPage,
    handlePrevPage,
    handleExpandWeek,
  } = useSalesmanMonthlyReport({ salesmanName });
  const period = monthFormat.format(
    new Date(currentDate.year, currentDate.month - 1),
  );
  const weeks = Object.entries(data?.weeks || {}).sort(
    ([a], [b]) => Number(a) - Number(b),
  );

  return (
    <div className="monthly-sales-report">
      <header className="finance-section-heading">
        <div>
          <h2>
            {data?.salesman ||
              salesmanName.charAt(0).toUpperCase() + salesmanName.slice(1)}
          </h2>
          <p className="finance-caption">Monthly performance</p>
        </div>
        <div
          className="sales-period-control"
          role="group"
          aria-label="Sales period"
        >
          <button
            type="button"
            className="icon-button finance-quiet-icon"
            aria-label="Previous month"
            disabled={!canGoPrevious}
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span aria-live="polite" aria-atomic="true">
            {period}
          </span>
          <button
            type="button"
            className="icon-button finance-quiet-icon"
            aria-label="Next month"
            disabled={!canGoNext}
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="sales-loading">
          <LoadingSpinner message={`Loading ${period} sales…`} />
        </div>
      ) : !data ? (
        <div className="people-empty" role={error ? "alert" : undefined}>
          <h3>Sales couldn’t be loaded</h3>
          <p>Please try again.</p>
          <button
            className="button button-quiet"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="people-inline-message" role="alert">
              The latest sales couldn’t be loaded. Showing your previous
              results.
              <button
                className="button button-quiet"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Try again
              </button>
            </div>
          )}
          <dl className="finance-metrics sales-metrics">
            {[
              ["Monthly sales", formatAmount(data.sales_monthly_total)],
              [
                "Incentive",
                `${rateFormat.format(data.incentive_percentage * 100)}%`,
              ],
              ["Bonus rate", "10%"],
              ["Commission", formatAmount(data.commission)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="finance-list-heading">
            <h3>Weekly invoices</h3>
            <span
              className="finance-caption"
              role={isFetching ? "status" : undefined}
            >
              {isFetching
                ? "Updating sales…"
                : `${weeks.length} ${weeks.length === 1 ? "week" : "weeks"}`}
            </span>
          </div>
          <div className="finance-records">
            {!weeks.length && (
              <p className="finance-empty-detail">
                No weekly invoices for this month.
              </p>
            )}
            {weeks.map(([weekNum, week]) => {
              const weekNumber = Number(weekNum),
                expanded = expandedWeek === weekNumber;
              const panelId = `${id}-week-${weekNum}`,
                pages = Math.max(
                  1,
                  Math.ceil(week.invoices.length / invoicesPerPage),
                );
              return (
                <div className="finance-record" key={weekNum}>
                  <button
                    className="finance-row sales-week-toggle"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => handleExpandWeek(weekNumber)}
                  >
                    <span className="finance-row-identity">
                      <span className="finance-row-icon" aria-hidden="true">
                        {weekNumber}
                      </span>
                      <span>
                        <span className="finance-row-title">
                          Week {weekNumber}
                        </span>
                        <span className="finance-caption">
                          {week.invoices.length}{" "}
                          {week.invoices.length === 1 ? "invoice" : "invoices"}
                        </span>
                      </span>
                    </span>
                    <span className="finance-row-value">
                      {formatAmount(week.total)}
                    </span>
                    <ChevronDown
                      size={18}
                      className="finance-chevron"
                      aria-hidden="true"
                    />
                  </button>
                  <DisclosurePanel id={panelId} expanded={expanded}>
                    <SalesInvoiceList
                      invoices={paginateInvoices(week.invoices)}
                    />
                    {pages > 1 && (
                      <nav
                        className="finance-pagination"
                        aria-label={`Week ${weekNumber} invoice pages`}
                      >
                        <p>
                          {(currentPage - 1) * invoicesPerPage + 1}–
                          {Math.min(
                            currentPage * invoicesPerPage,
                            week.invoices.length,
                          )}{" "}
                          of {week.invoices.length} invoices
                        </p>
                        <div>
                          <button
                            type="button"
                            className="icon-button finance-quiet-icon"
                            aria-label="Previous invoice page"
                            disabled={currentPage === 1}
                            onClick={handlePrevPage}
                          >
                            <ChevronLeft size={18} aria-hidden="true" />
                          </button>
                          <span aria-live="polite">
                            {currentPage} / {pages}
                          </span>
                          <button
                            type="button"
                            className="icon-button finance-quiet-icon"
                            aria-label="Next invoice page"
                            disabled={currentPage === pages}
                            onClick={handleNextPage}
                          >
                            <ChevronRight size={18} aria-hidden="true" />
                          </button>
                        </div>
                      </nav>
                    )}
                  </DisclosurePanel>
                </div>
              );
            })}
            <div className="finance-record">
              <button
                className="finance-row sales-shared-toggle"
                type="button"
                aria-expanded={sharedExpanded}
                aria-controls={`${id}-shared`}
                onClick={toggleSharedExpanded}
              >
                <span className="finance-row-identity">
                  <span className="finance-row-icon" aria-hidden="true">
                    <UsersRound size={18} />
                  </span>
                  <span>
                    <span className="finance-row-title">Shared sales</span>
                    <span className="finance-caption">
                      {formatAmount(data.monthly_total_share)} ×{" "}
                      {rateFormat.format(
                        data.monthly_total_share_percentage * 100,
                      )}
                      %
                    </span>
                  </span>
                </span>
                <span className="finance-row-value">
                  {formatAmount(data.personal_monthly_total_share)}
                </span>
                <ChevronDown
                  size={18}
                  className="finance-chevron"
                  aria-hidden="true"
                />
              </button>
              <DisclosurePanel id={`${id}-shared`} expanded={sharedExpanded}>
                <SalesInvoiceList invoices={data.invoice_shares_data} />
              </DisclosurePanel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
