import type { ReactNode } from "react";
/** Keeps wide financial/detail tables contained and scrollable by keyboard. */
export default function TableRegion({
  children,
  label = "Data table",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`table-region ${className}`}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
