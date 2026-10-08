import { useAuth } from "@context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SaveAll,
  Trash2,
  CloudUpload,
  Check,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import AutocompleteInput from "@components/AutoCompleteInput";
import { useEffect, useRef } from "react";
import { useReportEntryForm } from "@hooks/useReportEntryForm";
import ReportEntryStatus from "@components/ReportEntryStatus";
import { isBlankEntry, isDirty } from "@utils/reportEntryDraft";

const detailFields = [
  { key: "orders", label: "Orders", hint: "Products and quantities" },
  {
    key: "tel_orders",
    label: "Telephone orders",
    heading: "Tel. orders",
    hint: "Orders received by phone",
  },
  { key: "samples", label: "Samples", hint: "Samples provided" },
  {
    key: "new_product_intro",
    label: "New product introduction",
    heading: "Product intro",
    hint: "Products discussed",
  },
  {
    key: "old_product_followup",
    label: "Product follow-up",
    heading: "Follow-up",
    hint: "Updates and next steps",
  },
] as const;

// Only the active text field expands; other rows stay compact while reviewing.
function expandTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(144, textarea.scrollHeight + 2)}px`;
  revealEntry(textarea);
}

// Keep the active row's controls and save feedback below the sticky headings.
function revealEntry(control: HTMLElement) {
  const row = control.closest<HTMLElement>(".entry-container");
  const region = row?.closest<HTMLElement>(".report-table-region");
  if (!row || !region) return;
  const bounds = row.getBoundingClientRect();
  const viewport = region.getBoundingClientRect();
  const headerHeight =
    region.querySelector("thead")?.getBoundingClientRect().height || 0;
  const top = viewport.top + headerHeight + 4;
  const bottom = viewport.bottom - 4;
  if (bounds.top < top) region.scrollTop -= top - bounds.top;
  else if (bounds.bottom > bottom) region.scrollTop += bounds.bottom - bottom;
}

function focusEntry(root: HTMLDivElement | null, index: number) {
  const row = root?.querySelectorAll(".entry-container")[index];
  const target = row?.querySelector<HTMLInputElement>(
    "input:not([type=checkbox])",
  );
  if (!target) return false;
  const region = target.closest(".report-table-region");
  if (region) region.scrollLeft = 0;
  target.focus({ preventScroll: true });
  revealEntry(target);
  return true;
}

export default function ReportEntryForm() {
  const {
    entries,
    isLoading,
    savingAll,
    draftStorageError,
    recoveredCount,
    handleBlur,
    handleComposition,
    focusedEntryIdRef,
    handleFocus,
    currentPage,
    sortedDates,
    pagedDate,
    doctorNameSuggestions,
    districtSuggestions,
    setCurrentPage,
    handleChange,
    handleSubmitAllEntries,
    handleDelete,
    addEmptyEntry,
  } = useReportEntryForm();
  const { user } = useAuth();
  const entriesRef = useRef<HTMLDivElement>(null);
  const pendingEntryFocus = useRef(false);
  const reportEntries = entries.filter(
    (entry) => entry.id || !isBlankEntry(entry),
  );
  const failedCount = entries.filter(
    (entry) => entry.status === "error",
  ).length;
  const syncing =
    savingAll || entries.some((entry) => entry.status === "saving");
  const removing = entries.some((entry) => entry.status === "deleting");
  const hasRecovered = entries.some((entry) => entry.recovered);
  const waiting = reportEntries.some(
    (entry) => !entry.recovered && isDirty(entry),
  );
  const allSaved =
    !isLoading &&
    !savingAll &&
    reportEntries.length > 0 &&
    reportEntries.every(
      (entry) => !isDirty(entry) && !entry.recovered && entry.status === "idle",
    );
  const displayDate = new Date(`${pagedDate}T12:00:00`).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
  const feedback = {
    label: "Autosave on",
    description: "Changes autosave after a short pause. Use Save All anytime.",
    Icon: CloudUpload,
  };
  if (failedCount > 0) {
    feedback.label = `${failedCount} not saved · Save All to retry`;
    feedback.description = `${failedCount} ${failedCount === 1 ? "entry is" : "entries are"} not saved to the server. Use Save All to retry.`;
    feedback.Icon = AlertCircle;
  } else if (syncing) {
    feedback.label = "Saving changes...";
    feedback.description = "Saving in the background. You can keep typing.";
  } else if (removing) {
    feedback.label = "Removing entry...";
    feedback.description = "Removing an entry. You can keep typing.";
  } else if (hasRecovered) {
    feedback.label = "Review recovered drafts";
    feedback.description =
      "Recovered drafts for this date need review. Use Save All to save them.";
    feedback.Icon = RotateCcw;
  } else if (waiting) {
    feedback.label = "Waiting to autosave";
    feedback.description =
      "Waiting to autosave. Changes save after a short pause. Use Save All anytime.";
  } else if (isLoading) {
    feedback.label = "Loading reports...";
    feedback.description = "Loading reports for this date.";
  } else if (allSaved) {
    feedback.label = "All changes saved";
    feedback.description =
      "All changes for this date are saved to the server. Changes autosave after a short pause.";
    feedback.Icon = Check;
  }
  const HelpIcon = feedback.Icon;

  const handleAddEntry = () => {
    const blankIndex = entries.findIndex(
      (entry) => !entry.id && isBlankEntry(entry),
    );
    if (blankIndex >= 0 && focusEntry(entriesRef.current, blankIndex)) return;
    pendingEntryFocus.current = true;
    addEmptyEntry();
  };

  useEffect(() => {
    if (!pendingEntryFocus.current) return;
    const blankIndex = entries.findIndex(
      (entry) => !entry.id && isBlankEntry(entry),
    );
    if (blankIndex >= 0 && focusEntry(entriesRef.current, blankIndex))
      pendingEntryFocus.current = false;
  }, [entries]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      // Plain arrows belong to caret movement, select controls, and suggestions.
      if (
        !event.altKey ||
        event.isComposing ||
        !["ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      const index = entries.findIndex(
        (entry) => entry.clientId === focusedEntryIdRef.current,
      );
      if (index < 0) return;
      const next = index + (event.key === "ArrowUp" ? -1 : 1);
      const row =
        entriesRef.current?.querySelectorAll(".entry-container")[next];
      const target = row?.querySelector<HTMLElement>(
        "input:not([type=checkbox]), textarea",
      );
      if (target) {
        event.preventDefault();
        target.focus();
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [entries, focusedEntryIdRef]);

  return (
    <div className="report-editor" ref={entriesRef}>
      <div className="report-toolbar">
        <div className="report-title">
          <h1>Reports</h1>
          <span>
            {reportEntries.length}{" "}
            {reportEntries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div className="report-tools">
          <p
            id="report-help"
            className="report-help"
            role="status"
            aria-live="polite"
            aria-label={feedback.description}
            title={feedback.description}
          >
            <HelpIcon size={16} aria-hidden="true" />
            <span>{feedback.label}</span>
          </p>
          <div className="date-control" aria-label="Report date">
            <button
              className="icon-button"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= sortedDates.length - 1}
              aria-label="Prev date"
              title="Previous date"
            >
              <ChevronLeft size={19} />
            </button>
            <time dateTime={pagedDate}>{displayDate}</time>
            <button
              className="icon-button"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="Next date"
              title="Next date"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </div>
      {recoveredCount > 0 && (
        <p className="notice">
          Recovered {recoveredCount} unfinished{" "}
          {recoveredCount === 1 ? "entry" : "entries"}. Review and save them
          using the date arrows and Save All.
        </p>
      )}
      {draftStorageError && (
        <p role="alert" className="notice">
          Draft recovery is unavailable in this browser. Keep this page open
          until your rows show a saved checkmark.
        </p>
      )}
      <div
        className="report-table-region surface"
        role="region"
        aria-label="Report entries — scroll to view all fields"
        aria-describedby="report-help"
        tabIndex={0}
      >
        <table className="report-table">
          <caption className="sr-only">
            Report entries for {pagedDate}. Each entry is one row. Icons beside
            the row numbers show save status; hover an icon for details.
          </caption>
          <colgroup>
            <col className="report-col-number" />
            <col className="report-col-time" />
            <col className="report-col-client" />
            <col className="report-col-district" />
            <col className="report-col-type" />
            <col className="report-col-new" />
            {detailFields.map((field) => (
              <col key={field.key} className="report-col-detail" />
            ))}
            <col className="report-col-delete" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="report-row-number">
                <span className="sr-only">Entry and save status</span>#
              </th>
              <th scope="col" aria-label="Time range" title="Time range">
                Time
              </th>
              <th scope="col" aria-label="Client name" title="Client name">
                Client
              </th>
              <th scope="col">District</th>
              <th scope="col" aria-label="Client type" title="Client type">
                Type
              </th>
              <th
                scope="col"
                className="report-new-client"
                aria-label="New client"
                title="New client"
              >
                New
              </th>
              {detailFields.map((field) => (
                <th
                  key={field.key}
                  scope="col"
                  aria-label={field.label}
                  title={field.label}
                >
                  {"heading" in field ? field.heading : field.label}
                </th>
              ))}
              <th scope="col" className="report-row-delete">
                <span className="sr-only">Delete entry</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={12}>
                  <p role="status" className="report-empty">
                    Loading reports...
                  </p>
                </td>
              </tr>
            )}
            {!isLoading && entries.length === 0 && (
              <tr>
                <td colSpan={12}>
                  <p className="report-empty">
                    No entries for this date. Add an entry to start.
                  </p>
                </td>
              </tr>
            )}
            {entries.map((entry, index) => (
              <tr
                key={entry.clientId}
                className="entry-container"
                onFocusCapture={(event) => {
                  handleFocus(entry.clientId);
                  revealEntry(event.currentTarget);
                }}
                onBlurCapture={(event) => {
                  if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                  )
                    handleBlur(entry.clientId);
                }}
                onCompositionStartCapture={() =>
                  handleComposition(entry.clientId, true)
                }
                onCompositionEndCapture={() =>
                  handleComposition(entry.clientId, false)
                }
              >
                <th scope="row" className="report-row-number">
                  <span className="report-row-index">
                    <span>{index + 1}</span>
                    <ReportEntryStatus entry={entry} />
                  </span>
                </th>
                <td>
                  <label className="sr-only" htmlFor={`time-${entry.clientId}`}>
                    Time range
                  </label>
                  <input
                    id={`time-${entry.clientId}`}
                    type="text"
                    value={entry.time_range}
                    title={entry.time_range}
                    onChange={(event) =>
                      handleChange(
                        entry.clientId,
                        "time_range",
                        event.target.value,
                      )
                    }
                  />
                </td>
                <td>
                  <label
                    className="sr-only"
                    htmlFor={`client-${entry.clientId}`}
                  >
                    Client name
                  </label>
                  <AutocompleteInput
                    portalSuggestions
                    value={entry.doctor_name}
                    suggestions={doctorNameSuggestions}
                    onChange={(event) =>
                      handleChange(
                        entry.clientId,
                        "doctor_name",
                        event.target.value,
                      )
                    }
                    inputProps={{
                      id: `client-${entry.clientId}`,
                      maxLength: 20,
                      title: entry.doctor_name,
                    }}
                  />
                </td>
                <td>
                  <label
                    className="sr-only"
                    htmlFor={`district-${entry.clientId}`}
                  >
                    District
                  </label>
                  <AutocompleteInput
                    portalSuggestions
                    value={entry.district}
                    suggestions={districtSuggestions}
                    onChange={(event) =>
                      handleChange(
                        entry.clientId,
                        "district",
                        event.target.value,
                      )
                    }
                    inputProps={{
                      id: `district-${entry.clientId}`,
                      maxLength: 20,
                      title: entry.district,
                    }}
                  />
                </td>
                <td>
                  <label className="sr-only" htmlFor={`type-${entry.clientId}`}>
                    Client type
                  </label>
                  <select
                    id={`type-${entry.clientId}`}
                    value={entry.client_type}
                    onChange={(event) =>
                      handleChange(
                        entry.clientId,
                        "client_type",
                        event.target.value as "doctor" | "nurse",
                      )
                    }
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </td>
                <td className="report-new-client">
                  <label className="report-checkbox">
                    <span className="sr-only">New client</span>
                    <input
                      type="checkbox"
                      checked={entry.new_client}
                      onChange={(event) =>
                        handleChange(
                          entry.clientId,
                          "new_client",
                          event.target.checked,
                        )
                      }
                    />
                  </label>
                </td>
                {detailFields.map((field) => (
                  <td key={field.key}>
                    <label
                      className="sr-only"
                      htmlFor={`${field.key}-${entry.clientId}`}
                    >
                      {field.label}
                    </label>
                    <textarea
                      id={`${field.key}-${entry.clientId}`}
                      value={entry[field.key] || ""}
                      rows={1}
                      title={entry[field.key] || field.hint}
                      onFocus={(event) => expandTextarea(event.currentTarget)}
                      onBlur={(event) => {
                        event.currentTarget.style.height = "";
                        event.currentTarget.scrollTop = 0;
                      }}
                      onChange={(event) => {
                        handleChange(
                          entry.clientId,
                          field.key,
                          event.target.value,
                        );
                        expandTextarea(event.currentTarget);
                      }}
                    />
                  </td>
                ))}
                <td className="report-row-delete">
                  <button
                    type="button"
                    className="icon-button report-delete"
                    onClick={() => handleDelete(entry.clientId)}
                    disabled={
                      entry.status === "saving" || entry.status === "deleting"
                    }
                    aria-label="Delete"
                    title={`Delete entry ${index + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="report-bottom">
        <button type="button" className="button" onClick={handleAddEntry}>
          <Plus size={18} />
          Add New Entry
        </button>
        <p className="report-declaration">
          I, {user?.username}, declare the data provided are true and correct.
        </p>
        <button
          type="button"
          className="button button-primary"
          onClick={handleSubmitAllEntries}
        >
          <SaveAll size={17} />
          Save All
        </button>
      </div>
    </div>
  );
}
