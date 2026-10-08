import { format, parseISO } from "date-fns";
import type { ReportEntry } from "@interfaces/index";
import OverviewReportSection from "@components/OverviewReportSection";
import OverviewPeriodNavigation from "@components/OverviewPeriodNavigation";

export default function ReportEntryList({
  allEntries,
  currentDate,
  onDateChange,
  ...status
}: {
  allEntries: ReportEntry[];
  currentDate: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  hasData?: boolean;
  onRetry?: () => void;
}) {
  return (
    <OverviewReportSection
      mode="daily"
      entries={allEntries}
      period={format(parseISO(currentDate), "EEEE, d MMM yyyy")}
      {...status}
      navigation={
        <OverviewPeriodNavigation
          unit="day"
          value={currentDate}
          onChange={onDateChange}
        />
      }
    />
  );
}
