import { AlertCircle, Check, Circle, Clock, CloudUpload } from "lucide-react";
import { type FormEntry, isBlankEntry, isDirty } from "@utils/reportEntryDraft";

/** Static icons and a small live region: no spinner or blocking save state. */
const ReportEntryStatus = ({ entry }: { entry: FormEntry }) => {
  let Icon = Clock;
  let label = "Waiting to autosave";
  if (entry.status === "saving") {
    Icon = CloudUpload;
    label =
      entry.saveSource === "auto"
        ? "Autosaving..."
        : entry.localDraftSaved
          ? "Saved on this device · Syncing..."
          : "Saving...";
  } else if (entry.status === "deleting") {
    label = "Deleting...";
  } else if (entry.status === "error") {
    Icon = AlertCircle;
    label = "Not saved to server — click Save or Save All to retry.";
  } else if (entry.recovered) {
    label = "Recovered draft — review and Save.";
  } else if (!isDirty(entry)) {
    Icon = Check;
    label = "Saved";
  } else if (!entry.id && isBlankEntry(entry)) {
    Icon = Circle;
    label = "New entry";
  }
  return (
    <span
      id={`report-status-${entry.clientId}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="report-status"
      title={label}
    >
      <Icon size={16} aria-hidden="true" className="shrink-0" />
      <span className="report-status-label">{label}</span>
    </span>
  );
};

export default ReportEntryStatus;
