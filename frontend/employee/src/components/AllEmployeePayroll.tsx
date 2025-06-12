import PayrollInformation from "./PayrollInformation";
import { useAllEmployeePayroll } from "@hooks/useAllEmployeePayroll";
import { ChevronDown, ChevronUp, Printer } from "lucide-react";
import LoadingSpinner from "@components/LoadingSpinner";

const AllEmployeePayroll = () => {
  const {
    user,
    profiles,
    expandedId,
    isLoading,
    year,
    month,
    commissions,
    toggleExpand,
    handleViewPayrollPDF,
  } = useAllEmployeePayroll();



  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN" && user.role !== "CEO" && user.role !== "DIRECTOR")) {
    return (
      <div className="max-w-md mx-auto mt-6 text-red-600 font-semibold">
        You do not have permission to view all employee payrolls.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">All Employee Payrolls</h1>
      <button
        onClick={() => handleViewPayrollPDF()}
        className="
          fixed
          top-1/2
          right-4
          transform
          -translate-y-1/2
          flex
          flex-col
          items-center
          space-y-1
          bg-blue-600
          text-white
          px-3
          py-4
          rounded-lg
          shadow-lg
          hover:bg-blue-700
          hover:shadow-xl
          transition
          cursor-pointer
          z-50
        "
        aria-label="Print Payslip"
        title="Print Payslip"
      >
        <Printer size={24} />
      </button>

      {profiles.map((profile) => {
        const commission = commissions[profile.user.username] || 0;

        const salaryData = {
          baseSalary: parseFloat(profile.base_salary),
          bonusPayment: parseFloat(profile.bonus_payment),
          transportationAllowance: parseFloat(profile.transportation_allowance),
          commission,
          mpfDeduction: profile.is_mpf_exempt ? 0 : 0.05,
        };

        const grossPayment =
          salaryData.baseSalary +
          salaryData.bonusPayment +
          (salaryData.transportationAllowance || 0) +
          (salaryData.commission || 0);

        const mpfDeductionAmount = grossPayment * salaryData.mpfDeduction;
        const netPayment = grossPayment - mpfDeductionAmount;

        const isExpanded = expandedId === profile.id;

        return (
          <div
            key={profile.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(profile.id)}
              className="flex items-center justify-between w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  {profile.user.first_name} {profile.user.last_name}
                </p>
                <p className="text-sm text-gray-600">{profile.role}</p>
              </div>
              <div className="text-gray-500">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-6 bg-white border-t border-gray-200">
                <PayrollInformation
                  salaryData={salaryData}
                  grossPayment={grossPayment}
                  netPayment={netPayment}
                  mpfDeductionAmount={mpfDeductionAmount}
                  year={year}
                  month={month}
                  userRole={profile.role}
                  employeeId={profile.id}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AllEmployeePayroll;
