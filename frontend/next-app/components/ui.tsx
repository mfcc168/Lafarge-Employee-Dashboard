import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#17191c]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-[#69717d]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#69717d]">{label}</span>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f3f5] text-[#515862]">
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[#17191c]">{value}</div>
      {hint && <p className="mt-1 text-xs text-[#89919b]">{hint}</p>}
    </div>
  );
}

export function LoadingPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className="surface space-y-3 p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#f1d7d4] bg-[#fff8f7] p-5 text-sm text-[#9f2f25]">
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="surface px-6 py-12 text-center">
      <h3 className="font-semibold text-[#34383e]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[#7a828c]">{description}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const tones = {
    neutral: "bg-[#eef1f3] text-[#5b626b]",
    success: "bg-[#eaf7f0] text-[#18794e]",
    danger: "bg-[#fff0ee] text-[#a8241a]",
    warning: "bg-[#fff7e6] text-[#8a5a00]",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
