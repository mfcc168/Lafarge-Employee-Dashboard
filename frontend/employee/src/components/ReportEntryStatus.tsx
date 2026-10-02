import { AlertCircle, Check, Circle, Clock, CloudUpload } from "lucide-react";
import { type FormEntry, isBlankEntry, isDirty } from "@utils/reportEntryDraft";

/** Static icons and a small live region: no spinner or blocking save state. */
const ReportEntryStatus = ({ entry }: { entry: FormEntry }) => {
  let Icon = Clock;
  let label = "Waiting to autosave";
  let compactLabel = "Waiting";
  if (entry.status === "saving") {
    compactLabel = entry.saveSource === "auto" ? "Autosaving..." : "Syncing...";
    Icon = CloudUpload;
    label =
      entry.saveSource === "auto"
        ? "Autosaving..."
        : entry.localDraftSaved
          ? "Saved on this device · Syncing..."
          : "Saving...";
  } else if (entry.status === "deleting") {
    label = "Deleting...";
    compactLabel = label;
  } else if (entry.status === "error") {
    Icon = AlertCircle;
    label = "Not saved to server — use Save All to retry.";
    compactLabel = "Not saved";
  } else if (entry.recovered) {
    label = "Recovered draft — review and use Save All.";
    compactLabel = "Review draft";
  } else if (!isDirty(entry)) {
    Icon = Check;
    label = "Saved";
    compactLabel = label;
  } else if (!entry.id && isBlankEntry(entry)) {
    Icon = Circle;
    label = "New entry";
    compactLabel = "New";
  }
  return (
    <span
      id={`report-status-${entry.clientId}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
      className="report-status"
      title={label}
    >
      <Icon size={16} aria-hidden="true" className="shrink-0" />
      <span className="report-status-label">{compactLabel}</span>
    </span>
  );
};

export default ReportEntryStatus;
