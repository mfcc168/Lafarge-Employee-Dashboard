import type { ReportEntry } from "@interfaces/index";
import type { ReactNode } from "react";
import { CheckSquare, Square } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatReportTime, hasReportActivity } from "@utils/overviewReports";
import TableRegion from "@components/TableRegion";
import type { OverviewMode } from "@components/OverviewReportSection";

function VisitDetails({
  entry,
  weekly,
}: {
  entry: ReportEntry;
  weekly: boolean;
}) {
  return (
    <div className="overview-visit">
      {weekly && (
        <time dateTime={entry.date}>
          {format(parseISO(entry.date), "d MMM")}
        </time>
      )}
      {entry.time_range && (
        <span className="overview-time">
          {formatReportTime(entry.time_range)}
        </span>
      )}
      {entry.district && (
        <span className="overview-secondary">{entry.district}</span>
      )}
    </div>
  );
}

function ClientDetails({ entry }: { entry: ReportEntry }) {
  return (
    <div className="overview-client">
      <p className="overview-client-name">
        {entry.doctor_name || "Unnamed client"}
      </p>
      <div className="overview-client-meta">
        <span>{entry.client_type === "doctor" ? "Doctor" : "Nurse"}</span>
        {entry.new_client && (
          <span className="overview-new-client">New client</span>
        )}
      </div>
    </div>
  );
}

function Details({
  entry,
  discussion = false,
}: {
  entry: ReportEntry;
  discussion?: boolean;
}) {
  const fields = discussion
    ? [
        ["New product", entry.new_product_intro],
        ["Follow-up", entry.old_product_followup],
        ["Delivery update", entry.delivery_time_update],
      ]
    : [
        ["Orders", entry.orders],
        ["Telephone orders", entry.tel_orders],
        ["Samples", entry.samples],
      ];
  const values = fields.filter(([, value]) => value?.trim());
  return values.length ? (
    <dl className="overview-details">
      {values.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  ) : (
    <span
      className="overview-missing"
      aria-label={
        discussion ? "No discussion details" : "No order or sample details"
      }
    >
      —
    </span>
  );
}

export default function OverviewReportTable({
  entries,
  title,
  period,
  mode,
  limited,
  stateContent,
  completed,
  onComplete,
}: {
  entries: ReportEntry[];
  title: string;
  period: string;
  mode: OverviewMode;
  limited: boolean;
  stateContent?: ReactNode;
  completed: Set<string>;
  onComplete: (id: string) => void;
}) {
  const weekly = mode !== "daily";
  const showDiscussion = !weekly && !limited;
  const allowCompletion = !weekly && limited;
  const columns = showDiscussion ? 4 : 3;
  const isCompleted = (entry: ReportEntry) =>
    entry.id !== undefined && completed.has(String(entry.id));
  const completionButton = (entry: ReportEntry) => (
    <button
      type="button"
      className="overview-complete icon-button"
      aria-label={`Mark ${entry.doctor_name || "report"} ${entry.time_range} as ${isCompleted(entry) ? "incomplete" : "completed"}`}
      aria-pressed={isCompleted(entry)}
      disabled={entry.id === undefined}
      onClick={() => entry.id !== undefined && onComplete(String(entry.id))}
    >
      {isCompleted(entry) ? (
        <CheckSquare size={19} aria-hidden="true" />
      ) : (
        <Square size={19} aria-hidden="true" />
      )}
    </button>
  );
  const activity = (entry: ReportEntry) =>
    mode === "samples" ? (
      <p className="overview-sample-text">{entry.samples}</p>
    ) : (
      <Details entry={entry} />
    );

  return (
    <>
      <div className="overview-desktop-table">
        <TableRegion label={`${title} table`} className="overview-table-region">
          <table
            className={`overview-table ${allowCompletion ? "has-completion" : ""}`}
          >
            <caption className="sr-only">
              {title} · {period}
            </caption>
            <colgroup>
              <col className="overview-visit-column" />
              <col className="overview-client-column" />
              <col />
              {showDiscussion && <col />}
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Visit</th>
                <th scope="col">Client</th>
                <th scope="col">
                  {mode === "samples" ? "Samples" : "Orders & samples"}
                </th>
                {showDiscussion && <th scope="col">Product discussion</th>}
              </tr>
            </thead>
            <tbody>
              {stateContent ? (
                <tr>
                  <td colSpan={columns}>{stateContent}</td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr
                    key={entry.id || `${entry.date}-${index}`}
                    data-completed={allowCompletion && isCompleted(entry)}
                  >
                    <td>
                      <div className="overview-visit-cell">
                        {allowCompletion && completionButton(entry)}
                        <VisitDetails entry={entry} weekly={weekly} />
                      </div>
                    </td>
                    <td>
                      <ClientDetails entry={entry} />
                    </td>
                    <td>{activity(entry)}</td>
                    {showDiscussion && (
                      <td>
                        <Details entry={entry} discussion />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableRegion>
      </div>
      <div className="overview-mobile-records">
        {stateContent || (
          <ul className="overview-record-list" aria-label={`${title} records`}>
            {entries.map((entry, index) => {
              const showActivity =
                mode === "samples" || hasReportActivity(entry);
              const withDiscussion =
                showDiscussion &&
                [
                  entry.new_product_intro,
                  entry.old_product_followup,
                  entry.delivery_time_update,
                ].some((value) => value?.trim());
              return (
                <li
                  key={entry.id || `${entry.date}-${index}`}
                  data-completed={allowCompletion && isCompleted(entry)}
                >
                  <header className="overview-record-heading">
                    <div className="overview-record-client">
                      {allowCompletion && completionButton(entry)}
                      <ClientDetails entry={entry} />
                    </div>
                    <VisitDetails entry={entry} weekly={weekly} />
                  </header>
                  {(showActivity || withDiscussion) && (
                    <div
                      className={`overview-record-details ${showActivity && withDiscussion ? "has-discussion" : ""}`}
                    >
                      {showActivity && activity(entry)}
                      {withDiscussion && <Details entry={entry} discussion />}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
