import { LazyEmployeeManagement as EmployeeManagement } from "@components/LazyComponents";
import PageHeader from "@components/PageHeader";
export default function Employees() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR TEAM"
        title="Employees"
        description="People, profiles, and access. All in one place."
      />
      <EmployeeManagement />
    </div>
  );
}
