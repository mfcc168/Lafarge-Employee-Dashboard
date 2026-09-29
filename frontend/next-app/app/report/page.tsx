"use client";

import ReportEditor from "@/components/report-editor";
import { PageHeader } from "@/components/ui";

export default function ReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily report"
        description="Enter visits continuously. Leaving an edited row autosaves it in the background, while manual Save remains available at all times."
      />
      <ReportEditor />
    </div>
  );
}
