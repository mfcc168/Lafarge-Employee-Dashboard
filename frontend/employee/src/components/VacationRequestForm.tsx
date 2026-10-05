import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useVacationRequestForm } from "@hooks/useVacationRequestForm";
import SignaturePad from "@components/SignaturePad";
import { formatDisplayDate } from "@utils/displayDate";

export default function VacationRequestForm() {
  const {
    dateItems,
    submitting,
    calculating,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    getTotalVacationDay,
    getVacationDayLeft,
    excludedDates,
    signatureData,
    setSignatureData,
    clearSignature,
    user,
  } = useVacationRequestForm();

  return (
    <form
      className="people-panel vacation-form"
      aria-labelledby="vacation-form-title"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <header className="people-section-heading">
        <div>
          <h2 id="vacation-form-title">Request time off</h2>
          <p>Choose your dates and sign to send a request.</p>
        </div>
      </header>
      <div className="vacation-form-grid">
        <fieldset className="vacation-form-main" disabled={submitting}>
          <legend className="sr-only">Vacation dates and signature</legend>
          <div className="vacation-date-items">
            {dateItems.map((item, index) => (
              <fieldset key={index} className="vacation-date-item">
                <legend className="sr-only">Date {index + 1}</legend>
                <div className="vacation-date-item-heading">
                  <span>Date {index + 1}</span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove vacation item ${index + 1}`}
                    title={
                      dateItems.length === 1
                        ? "Keep at least one date"
                        : "Remove date"
                    }
                    disabled={dateItems.length === 1}
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="vacation-date-fields">
                  <div className="people-field">
                    <label htmlFor={`vacation-length-${index}`}>
                      Day length
                    </label>
                    <select
                      id={`vacation-length-${index}`}
                      value={item.type}
                      onChange={(event) => {
                        const date =
                          item.type === "half"
                            ? item.single_date
                            : item.from_date;
                        updateItem(
                          index,
                          event.target.value === "full"
                            ? {
                                type: "full",
                                leave_type: item.leave_type || "Annual Leave",
                                from_date: date || "",
                                to_date: date || "",
                              }
                            : {
                                type: "half",
                                leave_type: item.leave_type || "Annual Leave",
                                single_date: date || "",
                                half_day_period: "AM",
                              },
                        );
                      }}
                    >
                      <option value="full">Full day</option>
                      <option value="half">Half day</option>
                    </select>
                  </div>
                  <div className="people-field">
                    <label htmlFor={`vacation-type-${index}`}>Leave type</label>
                    <select
                      id={`vacation-type-${index}`}
                      value={item.leave_type}
                      onChange={(event) =>
                        updateItem(index, {
                          ...item,
                          leave_type: event.target.value as
                            | "Annual Leave"
                            | "Sick Leave",
                        })
                      }
                    >
                      <option value="Annual Leave">Annual</option>
                      <option value="Sick Leave">Sick</option>
                    </select>
                  </div>
                  {item.type === "full" ? (
                    <>
                      <div className="people-field">
                        <label htmlFor={`vacation-from-${index}`}>
                          From date
                        </label>
                        <input
                          id={`vacation-from-${index}`}
                          type="date"
                          value={item.from_date || ""}
                          required
                          onChange={(event) =>
                            updateItem(index, {
                              ...item,
                              from_date: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="people-field">
                        <label htmlFor={`vacation-to-${index}`}>To date</label>
                        <input
                          id={`vacation-to-${index}`}
                          type="date"
                          value={item.to_date || ""}
                          required
                          min={item.from_date}
                          onChange={(event) =>
                            updateItem(index, {
                              ...item,
                              to_date: event.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="people-field">
                        <label htmlFor={`vacation-single-${index}`}>Date</label>
                        <input
                          id={`vacation-single-${index}`}
                          type="date"
                          value={item.single_date || ""}
                          required
                          onChange={(event) =>
                            updateItem(index, {
                              ...item,
                              single_date: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="people-field">
                        <label htmlFor={`vacation-period-${index}`}>
                          Half day period
                        </label>
                        <select
                          id={`vacation-period-${index}`}
                          value={item.half_day_period || "AM"}
                          onChange={(event) =>
                            updateItem(index, {
                              ...item,
                              half_day_period: event.target.value as
                                | "AM"
                                | "PM",
                            })
                          }
                        >
                          <option value="AM">Morning (AM)</option>
                          <option value="PM">Afternoon (PM)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            className="button button-quiet vacation-add-date"
            aria-label="Add another vacation date"
            onClick={() => {
              addItem();
              requestAnimationFrame(() =>
                document
                  .getElementById(`vacation-length-${dateItems.length}`)
                  ?.focus(),
              );
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add another date
          </button>

          <section
            className="vacation-signature-section"
            aria-labelledby="vacation-signature-title"
          >
            <h3 id="vacation-signature-title">Your signature</h3>
            <p className="people-caption">
              Sign with your mouse or finger to confirm your request.
            </p>
            <SignaturePad
              value={signatureData}
              onChange={setSignatureData}
              onClear={clearSignature}
              disabled={submitting}
            />
          </section>
          <footer className="vacation-form-footer">
            <p className="people-caption">
              Your request will be sent for approval.
            </p>
            <button
              type="submit"
              className="button button-primary vacation-submit"
              disabled={submitting || calculating}
              aria-label="Submit vacation request"
              aria-describedby={
                calculating ? "vacation-calculation-status" : undefined
              }
            >
              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Sending request…
                </>
              ) : (
                <>
                  Submit request
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </footer>
        </fieldset>

        <aside
          className="vacation-summary"
          aria-labelledby="vacation-summary-title"
        >
          <h3 id="vacation-summary-title">Leave summary</h3>
          <p
            className="people-caption"
            id="vacation-calculation-status"
            aria-live="polite"
          >
            {calculating ? "Calculating days…" : "Annual leave · business days"}
          </p>
          <dl
            className="vacation-balance"
            aria-live="polite"
            aria-atomic="true"
            aria-busy={calculating}
          >
            <div>
              <dt>Available</dt>
              <dd>
                {user?.annual_leave_days ?? "—"}
                <span>days</span>
              </dd>
            </div>
            <div>
              <dt>This request</dt>
              <dd>
                {calculating ? "…" : getTotalVacationDay}
                <span>days</span>
              </dd>
            </div>
            <div className="vacation-balance-remaining">
              <dt>After request</dt>
              <dd>
                {calculating ? "…" : (getVacationDayLeft ?? "—")}
                <span>days</span>
              </dd>
            </div>
          </dl>
          {!calculating &&
            typeof getVacationDayLeft === "number" &&
            getVacationDayLeft < 0 && (
              <p className="vacation-balance-warning" role="status">
                <AlertCircle size={16} aria-hidden="true" />
                This request exceeds your available annual leave.
              </p>
            )}
          <p className="vacation-summary-note">
            Weekends and public holidays are excluded. Sick leave does not
            reduce this balance.
          </p>
          {excludedDates.length > 0 && (
            <details className="vacation-excluded-dates">
              <summary>
                <ChevronDown size={15} aria-hidden="true" />
                {excludedDates.length}{" "}
                {excludedDates.length === 1 ? "date" : "dates"} excluded
              </summary>
              <ul>
                {excludedDates.map((date) => (
                  <li key={date.date}>
                    <time dateTime={date.date}>
                      {formatDisplayDate(date.date)}
                    </time>
                    <span>
                      {date.reason === "Weekend"
                        ? "Weekend"
                        : date.name || "Public holiday"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </aside>
      </div>
    </form>
  );
}
