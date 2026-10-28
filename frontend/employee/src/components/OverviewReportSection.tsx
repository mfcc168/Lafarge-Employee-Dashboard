import { useId, useMemo, useState, type ReactNode } from "react";
import type { ReportEntry } from "@interfaces/index";
import { useAuth } from "@context/AuthContext";
import {
  hasReportActivity,
  reportStartMinutes,
  salesmanAliases,
} from "@utils/overviewReports";
import LoadingSpinner from "@components/LoadingSpinner";
import { ChevronDown } from "lucide-react";
import OverviewReportTable from "@components/OverviewReportTable";

export type OverviewMode = "daily" | "samples" | "new-clients";
export interface OverviewReportSectionProps {
  mode: OverviewMode;
  entries: ReportEntry[];
  period: string;
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  hasData?: boolean;
  onRetry?: () => void;
  navigation?: ReactNode;
}

export default function OverviewReportSection({
  mode,
  entries,
  period,
  isLoading,
  isFetching = false,
  isError = false,
  hasData = !isLoading,
  onRetry,
  navigation,
}: OverviewReportSectionProps) {
  const id = useId();
  const { user } = useAuth();
  const isSalesman = user?.role === "SALESMAN";
  const limited = user?.role === "CLERK" || user?.role === "DELIVERYMAN";
  const fullName = `${user?.firstname} ${user?.lastname}`;
  const [selection, setSelection] = useState("");
  const [completed, setCompleted] = useState(new Set<string>());
  const title =
    mode === "daily"
      ? "Daily reports"
      : mode === "samples"
        ? "Samples"
        : "New client orders";
  const loadingLabel =
    mode === "daily"
      ? "Loading daily reports…"
      : mode === "samples"
        ? "Loading weekly samples…"
        : "Loading new client orders…";
  const candidates = useMemo(
    () =>
      entries.filter((entry) => {
        if (isSalesman && entry.salesman_name !== fullName) return false;
        if (mode === "samples") return !!entry.samples?.trim();
        if (mode === "new-clients") return entry.new_client === true;
        return !limited || hasReportActivity(entry);
      }),
    [entries, fullName, isSalesman, limited, mode],
  );
  const salesmen = useMemo(
    () => [...new Set(candidates.map((entry) => entry.salesman_name))].sort(),
    [candidates],
  );
  // Retain a valid choice on refresh; unavailable choices fall back immediately.
  const selectedSalesman = isSalesman
    ? fullName
    : salesmen.includes(selection)
      ? selection
      : salesmen[0];
  const visible = useMemo(() => {
    const selected = candidates.filter(
      (entry) => entry.salesman_name === selectedSalesman,
    );
    return mode === "daily"
      ? selected.sort(
          (a, b) =>
            reportStartMinutes(a.time_range) - reportStartMinutes(b.time_range),
        )
      : selected;
  }, [candidates, mode, selectedSalesman]);
  const initialError = isError && !hasData;
  const Heading = mode === "daily" ? "h2" : "h3";
  const retry = onRetry && (
    <button
      type="button"
      className="button button-quiet"
      disabled={isFetching}
      onClick={onRetry}
    >
      Try again
    </button>
  );
  const stateContent = isLoading ? (
    <LoadingSpinner message={loadingLabel} />
  ) : initialError ? (
    <div className="overview-empty" role={onRetry ? "alert" : undefined}>
      <p>{title} couldn’t be loaded.</p>
      {retry}
    </div>
  ) : !visible.length ? (
    <div className="overview-empty">
      <p>
        {mode === "daily"
          ? limited
            ? "No orders or samples for this date"
            : "No reports for this date"
          : mode === "samples"
            ? "No samples for this week"
            : "No new client visits for this week"}
      </p>
      <span>
        Choose a different {mode === "daily" ? "date" : "week"} to view earlier
        activity.
      </span>
    </div>
  ) : undefined;
  const unit =
    mode === "daily"
      ? "report"
      : mode === "samples"
        ? "sample visit"
        : "new client visit";
  return (
    <section
      className="people-panel overview-panel"
      aria-labelledby={`${id}-title`}
    >
      <header className="overview-section-heading">
        <div>
          <Heading id={`${id}-title`}>{title}</Heading>
          {mode === "daily" && <p className="overview-caption">{period}</p>}
        </div>
        {navigation}
      </header>
      {isError && hasData && (
        <div
          className="people-inline-message overview-refresh-error"
          role="alert"
        >
          The latest reports couldn’t be loaded. Showing your previous results.
          {retry}
        </div>
      )}
      {hasData && !isLoading && (
        <div className="overview-table-toolbar">
          {!isSalesman && salesmen.length > 0 && (
            <div className="workspace-field overview-salesperson-field">
              <label htmlFor={`${id}-salesman`}>Salesperson</label>
              <div className="workspace-select">
                <select
                  className="workspace-input"
                  id={`${id}-salesman`}
                  value={selectedSalesman}
                  onChange={(event) => setSelection(event.target.value)}
                >
                  {salesmen.map((name) => (
                    <option key={name} value={name}>
                      {salesmanAliases[name] || name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
            </div>
          )}
          <p
            className="overview-result-count"
            role={isFetching ? "status" : undefined}
          >
            {isFetching
              ? `Updating ${title.toLowerCase()}…`
              : `${visible.length} ${unit}${visible.length === 1 ? "" : "s"}`}
          </p>
        </div>
      )}
      <OverviewReportTable
        entries={visible}
        title={title}
        period={period}
        mode={mode}
        limited={limited}
        stateContent={stateContent}
        completed={completed}
        onComplete={(entryId) =>
          setCompleted((previous) => {
            const next = new Set(previous);
            if (next.has(entryId)) next.delete(entryId);
            else next.add(entryId);
            return next;
          })
        }
      />
    </section>
  );
}
