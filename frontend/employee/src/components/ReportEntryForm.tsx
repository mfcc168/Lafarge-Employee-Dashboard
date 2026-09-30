import { useAuth } from "@context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SaveAll,
  Save,
  Trash2,
  CloudUpload,
} from "lucide-react";
import AutocompleteInput from "@components/AutoCompleteInput";
import { useEffect, useRef, useCallback } from "react";
import { useReportEntryForm } from "@hooks/useReportEntryForm";
import ReportEntryStatus from "@components/ReportEntryStatus";

const mainFields = [
  { key: "orders", label: "Orders", placeholder: "Products and quantities" },
  {
    key: "tel_orders",
    label: "Telephone orders",
    placeholder: "Orders received by phone",
  },
  { key: "samples", label: "Samples", placeholder: "Samples provided" },
] as const;
const followupFields = [
  {
    key: "new_product_intro",
    label: "New product introduction",
    placeholder: "Products discussed",
  },
  {
    key: "old_product_followup",
    label: "Product follow-up",
    placeholder: "Updates and next steps",
  },
] as const;

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
    handleSubmitEntry,
    handleSubmitAllEntries,
    handleDelete,
    addEmptyEntry,
  } = useReportEntryForm();
  const { user } = useAuth();
  const entriesRef = useRef<HTMLDivElement>(null);
  const adjustTextareaHeight = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      event.target.style.height = "auto";
      event.target.style.height = `${event.target.scrollHeight}px`;
    },
    [],
  );
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
      const row = entriesRef.current?.querySelectorAll(".entry-container")[next];
      const target = row?.querySelector<HTMLElement>("input:not([type=checkbox]), textarea");
      if (target) {
        event.preventDefault();
        target.focus();
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [entries, focusedEntryIdRef]);
  useEffect(() => {
    entriesRef.current?.querySelectorAll("textarea").forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [entries]);

  return (
    <div className="page-stack" ref={entriesRef}>
      <div className="report-toolbar surface">
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
        <button
          type="button"
          onClick={handleSubmitAllEntries}
          className="button button-primary"
        >
          <SaveAll size={17} />
          Save All
        </button>
      </div>
      <p className="report-help" role="status" aria-live="polite">
        <CloudUpload size={18} aria-hidden="true" />
        {savingAll
          ? "Saving changes in the background. You can keep typing."
          : "Changes autosave after a short pause. Save anytime for extra peace of mind."}
      </p>
      {recoveredCount > 0 && (
        <p className="notice">
          Recovered {recoveredCount} unfinished{" "}
          {recoveredCount === 1 ? "entry" : "entries"}. Review and save them
          using the date arrows.
        </p>
      )}
      {draftStorageError && (
        <p role="alert" className="notice">
          Draft recovery is unavailable in this browser. Keep this page open
          until your entries show Saved.
        </p>
      )}
      {isLoading && (
        <p role="status" className="report-help">
          Loading reports...
        </p>
      )}
      {!isLoading && entries.length === 0 && (
        <div className="surface empty-state">
          <h2>A fresh page for your day</h2>
          <p>Add an entry to record your first client visit.</p>
        </div>
      )}
      <div className="report-entries">
        {entries.map((entry, index) => (
          <div
            key={entry.clientId}
            className="entry-container"
            onFocusCapture={() => handleFocus(entry.clientId)}
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
            <div className="entry-heading">
              <div className="entry-title">
                <span className="entry-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>Client visit</h2>
              </div>
              <label className="check-field">
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
                New client
              </label>
            </div>
            <div className="entry-meta">
              <div className="field">
                <label htmlFor={`time-${entry.clientId}`}>Time range</label>
                <input
                  id={`time-${entry.clientId}`}
                  type="text"
                  value={entry.time_range}
                  onChange={(event) =>
                    handleChange(
                      entry.clientId,
                      "time_range",
                      event.target.value,
                    )
                  }
                  placeholder="09:00–10:00"
                />
              </div>
              <div className="field">
                <label htmlFor={`client-${entry.clientId}`}>Client name</label>
                <AutocompleteInput
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
                    placeholder: "Name of client",
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor={`district-${entry.clientId}`}>District</label>
                <AutocompleteInput
                  value={entry.district}
                  suggestions={districtSuggestions}
                  onChange={(event) =>
                    handleChange(entry.clientId, "district", event.target.value)
                  }
                  inputProps={{
                    id: `district-${entry.clientId}`,
                    maxLength: 20,
                    placeholder: "Select or type",
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor={`type-${entry.clientId}`}>Client type</label>
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
              </div>
            </div>
            <div className="entry-details">
              {mainFields.map((field) => (
                <div className="field" key={field.key}>
                  <label htmlFor={`${field.key}-${entry.clientId}`}>
                    {field.label}
                  </label>
                  <textarea
                    id={`${field.key}-${entry.clientId}`}
                    value={entry[field.key]}
                    rows={2}
                    placeholder={field.placeholder}
                    onChange={(event) => {
                      handleChange(
                        entry.clientId,
                        field.key,
                        event.target.value,
                      );
                      adjustTextareaHeight(event);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="entry-followup">
              {followupFields.map((field) => (
                <div className="field" key={field.key}>
                  <label htmlFor={`${field.key}-${entry.clientId}`}>
                    {field.label}
                  </label>
                  <textarea
                    id={`${field.key}-${entry.clientId}`}
                    value={entry[field.key] || ""}
                    rows={2}
                    placeholder={field.placeholder}
                    onChange={(event) => {
                      handleChange(
                        entry.clientId,
                        field.key,
                        event.target.value,
                      );
                      adjustTextareaHeight(event);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="entry-footer">
              <ReportEntryStatus entry={entry} />
              <div className="entry-actions">
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => handleDelete(entry.clientId)}
                  disabled={
                    entry.status === "saving" || entry.status === "deleting"
                  }
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => handleSubmitEntry(entry.clientId)}
                  aria-describedby={`report-status-${entry.clientId}`}
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="report-bottom">
        <button type="button" className="button" onClick={addEmptyEntry}>
          <Plus size={18} />
          Add New Entry
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={handleSubmitAllEntries}
        >
          <SaveAll size={17} />
          Save All
        </button>
      </div>
      <p className="report-help">
        I, {user?.username}, declare the data provided are true and correct.
      </p>
    </div>
  );
}
