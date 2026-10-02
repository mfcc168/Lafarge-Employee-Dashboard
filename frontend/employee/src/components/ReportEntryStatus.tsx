import {
  AlertCircle,
  Check,
  Circle,
  CircleDot,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { type FormEntry, isBlankEntry, isDirty } from "@utils/reportEntryDraft";

/** Row-index feedback keeps the editor usable while a write is pending. */
const ReportEntryStatus = ({ entry }: { entry: FormEntry }) => {
  let Icon = CircleDot;
  let label = "Waiting to autosave";
  let state = "unsaved";
  if (entry.status === "saving") {
    state = "saving";
    Icon = LoaderCircle;
    label =
      entry.saveSource === "auto"
        ? "Autosaving..."
        : entry.localDraftSaved
          ? "Saved on this device · Syncing..."
          : "Saving...";
  } else if (entry.status === "deleting") {
    state = "deleting";
    Icon = LoaderCircle;
    label = "Deleting...";
  } else if (entry.status === "error") {
    state = "error";
    Icon = AlertCircle;
    label = "Not saved to server — use Save All to retry.";
  } else if (entry.recovered) {
    state = "recovered";
    Icon = RotateCcw;
    label = "Recovered draft — review and use Save All.";
  } else if (!isDirty(entry)) {
    state = "saved";
    Icon = Check;
    label = "Saved";
  } else if (!entry.id && isBlankEntry(entry)) {
    state = "new";
    Icon = Circle;
    label = "New entry";
  }
  return (
    <span
      id={`report-status-${entry.clientId}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
      className="report-status"
      data-save-state={state}
      title={label}
    >
      <Icon size={14} aria-hidden="true" className="report-status-icon" />
      <span className="sr-only">{label}</span>
    </span>
  );
};

export default ReportEntryStatus;
