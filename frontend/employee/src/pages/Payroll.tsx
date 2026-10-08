import { LazyAllEmployeePayroll as AllEmployeePayroll } from "@components/LazyComponents";
import PageHeader from "@components/PageHeader";
export default function Payroll() {
  return (
    <div className="page-stack payroll-page">
      <PageHeader
        eyebrow="PEOPLE & PAY"
        title="Payroll"
        description="A clear view of your team’s compensation and benefits."
      />
      <AllEmployeePayroll />
    </div>
  );
}
