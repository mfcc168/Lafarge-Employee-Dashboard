"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Printer } from "lucide-react";
import { api, apiBlob, salesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PAYROLL_ROLES, type EmployeeProfile } from "@/lib/types";
import { ErrorPanel, LoadingPanel, PageHeader, StatCard } from "@/components/ui";

function payrollPeriod() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const beforeSalaryDay = today.getDate() < 10;
  const month = beforeSalaryDay
    ? currentMonth === 1
      ? 12
      : currentMonth - 1
    : currentMonth;
  const year = beforeSalaryDay && currentMonth === 1
    ? today.getFullYear() - 1
    : today.getFullYear();
  let commissionMonth = month - 1;
  let commissionYear = year;
  if (commissionMonth === 0) {
    commissionMonth = 12;
    commissionYear -= 1;
  }
  return { year, month, commissionYear, commissionMonth };
}

function number(value: string | number | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function PayrollPage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const period = useMemo(payrollPeriod, []);

  const profiles = useQuery({
    queryKey: ["payroll", "profiles"],
    queryFn: () => api<EmployeeProfile[]>("salaries/"),
    enabled: !!user && PAYROLL_ROLES.includes(user.role),
  });

  const commissions = useQuery({
    queryKey: ["payroll", "commissions", period.commissionYear, period.commissionMonth],
    queryFn: async () => {
      const rows = await salesApi<Array<{ salesman: string; commission: number }>>(
        `salesmen/commissions/${period.commissionYear}/${period.commissionMonth}/`,
      );
      const names: Record<string, string> = {
        "Dominic So": "dominic",
        "Alex Cheung": "alex",
        "Matthew Mak": "matthew",
      };
      return rows.reduce<Record<string, number>>((acc, row) => {
        const username = names[row.salesman] || row.salesman.toLowerCase();
        acc[username] = row.commission;
        return acc;
      }, {});
    },
    enabled: !!user && PAYROLL_ROLES.includes(user.role),
    retry: false,
  });

  if (!user || !PAYROLL_ROLES.includes(user.role)) {
    return <ErrorPanel message="Only administrators and directors can view payroll." />;
  }

  if (profiles.isLoading) return <LoadingPanel rows={6} />;
  if (profiles.error) return <ErrorPanel message="Unable to load payroll data." />;

  const commissionMap = commissions.data || {};
  const rows = (profiles.data || []).map((profile) => {
    const commission = commissionMap[profile.user.username] || 0;
    const gross =
      number(profile.base_salary) +
      number(profile.bonus_payment) +
      number(profile.year_end_bonus) +
      number(profile.transportation_allowance) +
      commission;
    const mpf = profile.is_mpf_exempt ? 0 : Math.min(1500, gross * 0.05);
    return { profile, commission, gross, mpf, net: gross - mpf };
  });
  const total = rows.reduce((sum, row) => sum + row.net, 0);

  const printAll = async () => {
    const blob = await apiBlob("payroll/pdf/", {
      method: "POST",
      body: JSON.stringify({
        profiles: profiles.data || [],
        commissions: commissionMap,
        year: period.year,
        month: period.month,
      }),
    });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description={new Date(period.year, period.month - 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
        actions={
          <button className="btn-primary" onClick={() => void printAll()}>
            <Printer size={16} /> Print all
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total net payroll" value={`$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <StatCard label="Active employees" value={rows.length} />
        <StatCard
          label="Commission data"
          value={commissions.error ? "Unavailable" : "Loaded"}
          hint={commissions.error ? "Configure SALES_API_URL to include commission." : undefined}
        />
      </div>

      <div className="space-y-3">
        {rows.map(({ profile, commission, gross, mpf, net }) => {
          const open = expanded === profile.id;
          return (
            <div key={profile.id} className="surface overflow-hidden">
              <button
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
                onClick={() => setExpanded(open ? null : profile.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[#25292e]">
                    {profile.user.first_name} {profile.user.last_name}
                  </div>
                  <div className="text-sm text-[#7a828c]">
                    {profile.role} · @{profile.user.username}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#25292e]">
                    ${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-[#8a929c]">net pay</div>
                </div>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {open && (
                <div className="grid gap-4 border-t border-[#edf0f2] bg-[#fafbfb] p-5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Base salary", number(profile.base_salary)],
                    ["Bonus", number(profile.bonus_payment) + number(profile.year_end_bonus)],
                    ["Transport", number(profile.transportation_allowance)],
                    ["Commission", commission],
                    ["Gross", gross],
                    ["MPF", -mpf],
                    ["Net", net],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <div className="text-xs font-medium uppercase tracking-wide text-[#8a929c]">{label}</div>
                      <div className="mt-1 font-semibold text-[#34383e]">
                        ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-end">
                    <Link href={`/employees/${profile.id}`} className="btn-secondary">
                      Edit compensation
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
