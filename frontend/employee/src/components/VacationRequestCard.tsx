import type { ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, Clock3, X } from "lucide-react";
import type { VacationRequest } from "@interfaces/index";
import { formatDisplayDate } from "@utils/displayDate";

export default function VacationRequestCard({
  request,
  showEmployee = false,
  actions,
  busy = false,
}: {
  request: VacationRequest;
  showEmployee?: boolean;
  actions?: ReactNode;
  busy?: boolean;
}) {
  const StatusIcon =
    request.status === "approved"
      ? Check
      : request.status === "rejected"
        ? X
        : Clock3;
  const status =
    request.status.charAt(0).toUpperCase() + request.status.slice(1);

  return (
    <article
      className="vacation-request-card"
      aria-labelledby={`vacation-request-${request.id}`}
      aria-busy={busy}
    >
      <header className="vacation-request-heading">
        <div>
          <h3 id={`vacation-request-${request.id}`}>
            {showEmployee ? request.employee : `Request #${request.id}`}
          </h3>
          {showEmployee && (
            <p className="people-caption">Request #{request.id}</p>
          )}
        </div>
        <span className={`request-status request-status-${request.status}`}>
          <StatusIcon size={14} aria-hidden="true" />
          {status}
        </span>
      </header>

      <ul className="vacation-request-dates">
        {request.date_items.map((item, index) => (
          <li key={index}>
            <CalendarDays size={16} aria-hidden="true" />
            <div>
              <p className="vacation-date-range">
                {item.type === "half" ? (
                  <>
                    <time dateTime={item.single_date}>
                      {formatDisplayDate(item.single_date)}
                    </time>
                    <span> · {item.half_day_period || "AM"}</span>
                  </>
                ) : (
                  <>
                    <time dateTime={item.from_date}>
                      {formatDisplayDate(item.from_date)}
                    </time>
                    {item.to_date !== item.from_date && (
                      <>
                        <span> – </span>
                        <time dateTime={item.to_date}>
                          {formatDisplayDate(item.to_date)}
                        </time>
                      </>
                    )}
                  </>
                )}
              </p>
              <p className="people-caption">
                {item.leave_type || "Annual Leave"} ·{" "}
                {item.type === "half" ? "Half day" : "Full day"}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {request.signature_data && (
        <details className="vacation-saved-signature">
          <summary>
            <ChevronDown size={15} aria-hidden="true" />
            View signature
          </summary>
          <img
            src={request.signature_data}
            alt={
              showEmployee
                ? `Signature from ${request.employee}`
                : "Your submitted signature"
            }
          />
        </details>
      )}
      {actions && <div className="vacation-request-actions">{actions}</div>}
    </article>
  );
}
