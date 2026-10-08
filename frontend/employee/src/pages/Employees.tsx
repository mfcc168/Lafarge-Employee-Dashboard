import { LazyEmployeeManagement as EmployeeManagement } from "@components/LazyComponents";
import PageHeader from "@components/PageHeader";
export default function Employees() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR TEAM"
        title="Employees"
        description="Your team, profiles and account access."
      />
      <EmployeeManagement />
    </div>
  );
}
