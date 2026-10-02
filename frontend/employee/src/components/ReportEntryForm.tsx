import { useAuth } from "@context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SaveAll,
  Trash2,
  CloudUpload,
} from "lucide-react";
import AutocompleteInput from "@components/AutoCompleteInput";
import { useEffect, useRef } from "react";
import { useReportEntryForm } from "@hooks/useReportEntryForm";
import ReportEntryStatus from "@components/ReportEntryStatus";
import { isBlankEntry, isDirty } from "@utils/reportEntryDraft";

const detailFields = [
  { key: "orders", label: "Orders", placeholder: "Products and quantities" },
  {
    key: "tel_orders",
    label: "Telephone orders",
    heading: "Tel. orders",
    placeholder: "Orders received by phone",
  },
  { key: "samples", label: "Samples", placeholder: "Samples provided" },
  {
    key: "new_product_intro",
    label: "New product introduction",
    heading: "New product intro",
    placeholder: "Products discussed",
  },
  {
    key: "old_product_followup",
    label: "Product follow-up",
    placeholder: "Updates and next steps",
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
  const failedCount = entries.filter(
    (entry) => entry.status === "error",
  ).length;
  const syncing =
    savingAll || entries.some((entry) => entry.status === "saving");
  const waiting = entries.some(
    (entry) => !entry.recovered && isDirty(entry) && !isBlankEntry(entry),
  );
  const helpDescription =
    failedCount > 0
      ? `${failedCount} ${failedCount === 1 ? "entry is" : "entries are"} not saved to the server. Use Save All to retry.`
      : syncing
        ? "Saving in the background. You can keep typing."
        : waiting
          ? "Waiting to autosave. Changes save after a short pause. Use Save All anytime."
          : "Changes autosave after a short pause. Use Save All anytime.";

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
            {entries.length} {entries.length === 1 ? "row" : "rows"}
          </span>
        </div>
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
          <time dateTime={sortedDates[currentPage]}>
            {sortedDates[currentPage]}
          </time>
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
        <p
          id="report-help"
          className="report-help"
          role="status"
          aria-live="polite"
          aria-label={helpDescription}
          title={helpDescription}
        >
          <CloudUpload size={16} aria-hidden="true" />
          <span>
            {failedCount > 0
              ? `${failedCount} not saved · Save All to retry`
              : syncing
                ? "Saving changes..."
                : waiting
                  ? "Waiting to autosave"
                  : "Autosave on"}
          </span>
        </p>
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
          until your entries show Saved.
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
            Report entries for {sortedDates[currentPage]}. Each entry is one
            row.
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
            <col className="report-col-status" />
            <col className="report-col-delete" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="report-row-number">
                <span className="sr-only">Entry</span>#
              </th>
              <th scope="col">Time range</th>
              <th scope="col">Client name</th>
              <th scope="col">District</th>
              <th scope="col">Client type</th>
              <th scope="col" className="report-new-client">
                New client
              </th>
              {detailFields.map((field) => (
                <th key={field.key} scope="col">
                  {"heading" in field ? field.heading : field.label}
                </th>
              ))}
              <th scope="col">Status</th>
              <th scope="col" className="report-row-delete">
                <span className="sr-only">Delete entry</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={13}>
                  <p role="status" className="report-empty">
                    Loading reports...
                  </p>
                </td>
              </tr>
            )}
            {!isLoading && entries.length === 0 && (
              <tr>
                <td colSpan={13}>
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
                  {index + 1}
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
                    placeholder="0900-1000"
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
                      placeholder: "Client name",
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
                      placeholder: "District",
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
                      title={entry[field.key] || field.placeholder}
                      placeholder={field.placeholder}
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
                <td className="report-row-status">
                  <ReportEntryStatus entry={entry} />
                </td>
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
        <button type="button" className="button" onClick={addEmptyEntry}>
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
