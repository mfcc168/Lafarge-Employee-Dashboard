import OverviewReportSection, {
  type OverviewReportSectionProps,
} from "@components/OverviewReportSection";
import { formatWeekRange } from "@utils/overviewReports";

export default function WeeklySamplesSummary({
  weekStart,
  ...props
}: Omit<OverviewReportSectionProps, "mode" | "period" | "navigation"> & {
  weekStart: string;
}) {
  return (
    <OverviewReportSection
      mode="samples"
      period={formatWeekRange(weekStart)}
      {...props}
    />
  );
}
