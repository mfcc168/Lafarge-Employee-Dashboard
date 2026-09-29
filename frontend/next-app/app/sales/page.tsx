"use client";

import { useAuth } from "@/lib/auth";
import { SALES_ROLES } from "@/lib/types";
import { ErrorPanel, PageHeader } from "@/components/ui";
import SalesReport from "@/components/sales-report";

export default function SalesPage() {
  const { user } = useAuth();

  if (!user || !SALES_ROLES.includes(user.role)) {
    return <ErrorPanel message="You do not have permission to view sales information." />;
  }

  const salesmen =
    user.role === "SALESMAN"
      ? [user.username.toLowerCase()]
      : ["dominic", "matthew", "alex"];

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.role === "SALESMAN" ? "My sales" : "Sales overview"}
        description="Monthly sales and commission information from the ERP sales API."
      />
      <div className="space-y-8">
        {salesmen.map((salesman) => (
          <section key={salesman} className="space-y-3">
            {salesmen.length > 1 && (
              <h2 className="text-lg font-semibold capitalize">{salesman}</h2>
            )}
            <SalesReport salesman={salesman} />
          </section>
        ))}
      </div>
    </div>
  );
}
