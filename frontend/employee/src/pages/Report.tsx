import { LazyReportEntryForm as ReportEntryForm } from "@components/LazyComponents";
import PageHeader from "@components/PageHeader";

export default function Report() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR DAILY WORK"
        title="Reports"
        description="Capture the details. We’ll keep your changes saved."
      />
      <ReportEntryForm />
    </div>
  );
}
