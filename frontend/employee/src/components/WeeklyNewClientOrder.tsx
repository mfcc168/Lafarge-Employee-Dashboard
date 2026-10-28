import OverviewReportSection, {
  type OverviewReportSectionProps,
} from "@components/OverviewReportSection";
import { formatWeekRange } from "@utils/overviewReports";

export default function WeeklyNewClientOrder({
  weekStart,
  ...props
}: Omit<OverviewReportSectionProps, "mode" | "period" | "navigation"> & {
  weekStart: string;
}) {
  return (
    <OverviewReportSection
      mode="new-clients"
      period={formatWeekRange(weekStart)}
      {...props}
    />
  );
}
