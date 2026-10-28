import { addDays, format, parseISO } from "date-fns";
import type { ReportEntry } from "@interfaces/index";

export function formatWeekRange(start: string) {
  const first = parseISO(start);
  const last = addDays(first, 6);
  return `${format(first, first.getFullYear() === last.getFullYear() ? "d MMM" : "d MMM yyyy")} – ${format(last, "d MMM yyyy")}`;
}

export function formatReportTime(value: string) {
  return value.replace(/^(\d{2})(\d{2})\s*-\s*(\d{2})(\d{2})$/, "$1:$2–$3:$4");
}

export function reportStartMinutes(value: string) {
  const match = value?.match(/^(\d{2}):?(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export function hasReportActivity(entry: ReportEntry) {
  return [entry.orders, entry.tel_orders, entry.samples].some((value) =>
    value?.trim(),
  );
}

export const salesmanAliases: Record<string, string> = {
  "Ho Yeung Cheung": "Alex",
  "Hung Ki So": "Dominic",
  "Kwok Wai Mak": "Matthew",
};
