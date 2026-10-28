const displayDate = new Intl.DateTimeFormat("en-HK", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDisplayDate(value?: string) {
  if (!value) return "Date not recorded";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : displayDate.format(date);
}
