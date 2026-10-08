import { useAuth } from "@context/AuthContext";
import { LazySalesmanMonthlyReport as SalesmanMonthlyReport } from "@components/LazyComponents";
import PageHeader from "@components/PageHeader";
export default function Sales() {
  const { user } = useAuth();
  const isSalesman = user?.role === "SALESMAN";
  const isManager = ["MANAGER", "ADMIN", "CEO", "DIRECTOR"].includes(
    user?.role || "",
  );
  return (
    <div className="page-stack sales-page">
      <PageHeader
        eyebrow="PERFORMANCE"
        title={isSalesman ? "My sales" : "Sales overview"}
        description="Monthly performance, invoices, and commission at a glance."
      />
      {isSalesman && user?.username && (
        <section
          className="people-panel sales-panel"
          aria-label="My monthly sales"
        >
          <SalesmanMonthlyReport
            salesmanName={user.username.toLowerCase().trim()}
          />
        </section>
      )}
      {isManager &&
        ["Dominic", "Matthew"].map((name) => (
          <section
            className="people-panel sales-panel"
            key={name}
            aria-label={`${name}’s monthly sales`}
          >
            <SalesmanMonthlyReport salesmanName={name.toLowerCase()} />
          </section>
        ))}
    </div>
  );
}
