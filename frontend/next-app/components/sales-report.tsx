"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { salesApi } from "@/lib/api";
import type { SalesmanMonthlyReportData } from "@/lib/types";
import { ErrorPanel, LoadingPanel, StatCard } from "@/components/ui";

export default function SalesReport({ salesman }: { salesman: string }) {
  const [month, setMonth] = useState(() => new Date());
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const year = month.getFullYear();
  const monthNumber = month.getMonth() + 1;

  const report = useQuery({
    queryKey: ["sales", salesman, year, monthNumber],
    queryFn: () =>
      salesApi<SalesmanMonthlyReportData>(
        `salesman/${salesman}/monthly/${year}/${monthNumber}/`,
      ),
    retry: false,
  });

  return (
    <div className="space-y-4">
      <div className="surface flex items-center justify-between gap-3 p-3">
        <button className="btn-secondary !p-2.5" onClick={() => setMonth((value) => addMonths(value, -1))}>
          <ChevronLeft size={17} />
        </button>
        <div className="text-center">
          <div className="font-semibold text-[#30343a]">{salesman}</div>
          <div className="text-sm text-[#7a828c]">{format(month, "MMMM yyyy")}</div>
        </div>
        <button
          className="btn-secondary !p-2.5"
          disabled={addMonths(month, 1) > new Date()}
          onClick={() => setMonth((value) => addMonths(value, 1))}
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {report.isLoading ? (
        <LoadingPanel rows={4} />
      ) : report.error ? (
        <ErrorPanel message={report.error instanceof Error ? report.error.message : "Unable to load sales data."} />
      ) : report.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Monthly sales" value={`$${report.data.sales_monthly_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <StatCard label="Commission" value={`$${report.data.commission.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <StatCard label="Incentive" value={`${(report.data.incentive_percentage * 100).toFixed(1)}%`} />
            <StatCard label="Shared sales" value={`$${report.data.personal_monthly_total_share.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-[#edf0f2] px-5 py-4">
              <h3 className="font-semibold">Weekly breakdown</h3>
            </div>
            <div className="divide-y divide-[#edf0f2]">
              {Object.entries(report.data.weeks || {}).map(([week, data]) => {
                const weekNumber = Number(week);
                const open = expandedWeek === weekNumber;
                return (
                  <div key={week}>
                    <button
                      className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-[#fafbfb]"
                      onClick={() => setExpandedWeek(open ? null : weekNumber)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Week {weekNumber}</div>
                        <div className="text-sm text-[#7a828c]">{data.invoices.length} invoices</div>
                      </div>
                      <div className="font-semibold">
                        ${data.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </button>
                    {open && (
                      <div className="border-t border-[#edf0f2] bg-[#fafbfb]">
                        {data.invoices.map((invoice) => (
                          <div
                            key={invoice.number}
                            className="grid gap-2 border-b border-[#edf0f2] px-5 py-4 last:border-0 sm:grid-cols-[1fr_160px]"
                          >
                            <div>
                              <div className="font-medium text-[#30343a]">
                                #{invoice.number} · {invoice.customer}
                              </div>
                              <div className="mt-1 text-sm text-[#747c86]">
                                {invoice.items.join(", ")}
                              </div>
                            </div>
                            <div className="sm:text-right">
                              <div className="font-semibold">
                                ${invoice.total_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-[#8a929c]">{invoice.delivery_date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
