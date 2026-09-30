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
    <div className="page-stack">
      <PageHeader
        eyebrow="PERFORMANCE"
        title={isSalesman ? "My sales" : "Sales overview"}
        description="Monthly performance, invoices, and commission at a glance."
      />
      {isSalesman && user?.username && (
        <section className="surface surface-pad">
          <SalesmanMonthlyReport
            salesmanName={user.username.toLowerCase().trim()}
          />
        </section>
      )}
      {isManager &&
        ["Dominic", "Matthew"].map((name) => (
          <section className="surface surface-pad" key={name}>
            <div className="section-bar">
              <h2>{name}’s performance</h2>
            </div>
            <SalesmanMonthlyReport salesmanName={name.toLowerCase()} />
          </section>
        ))}
    </div>
  );
}
