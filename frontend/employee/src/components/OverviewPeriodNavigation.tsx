import { addDays, format, parseISO, startOfISOWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function OverviewPeriodNavigation({
  value,
  onChange,
  unit,
}: {
  value: string;
  onChange: (value: string) => void;
  unit: "day" | "week";
}) {
  const latest = format(
    unit === "day" ? new Date() : startOfISOWeek(new Date()),
    "yyyy-MM-dd",
  );
  const step = unit === "day" ? 1 : 7;
  const move = (direction: -1 | 1) => {
    const next = format(
      addDays(parseISO(value), direction * step),
      "yyyy-MM-dd",
    );
    if (next <= latest) onChange(next);
  };
  return (
    <div
      className="overview-period-control"
      role="group"
      aria-label={
        unit === "day" ? "Daily report dates" : "Weekly activity dates"
      }
    >
      <button
        type="button"
        className="icon-button"
        aria-label={`Previous ${unit}`}
        onClick={() => move(-1)}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="button button-quiet overview-period-reset"
        disabled={value === latest}
        onClick={() => onChange(latest)}
      >
        {unit === "day" ? "Today" : "This week"}
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Next ${unit}`}
        disabled={value >= latest}
        onClick={() => move(1)}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
