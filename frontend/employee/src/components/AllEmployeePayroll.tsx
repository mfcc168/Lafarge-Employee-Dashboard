import PayrollInformation from "./PayrollInformation";
import { useAllEmployeePayroll } from "@hooks/useAllEmployeePayroll";
import { ChevronDown, ChevronUp, Printer } from "lucide-react";
import LoadingSpinner from "@components/LoadingSpinner";

/**
 * Component to display and manage all employee payroll information
 * for authorized users (MANAGER, ADMIN, CEO, DIRECTOR)
 */
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


  // Check if user is unauthorized (not manager, admin, CEO, or director)
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN" && user.role !== "CEO" && user.role !== "DIRECTOR")) {
    return (
      <div className="max-w-md mx-auto mt-6 text-red-600 font-semibold">
        You do not have permission to view all employee payrolls.
      </div>
    );
  }

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-800">All Employee Payrolls</h1>
      {/* Print button (fixed position) */}
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

      {/* Map through each employee profile to create payroll cards */}
      {profiles.map((profile) => {
        // Get commission for current employee or default to 0
        const commission = commissions[profile.user.username] || 0;
        // Structure salary data for calculations
        const salaryData = {
          baseSalary: parseFloat(profile.base_salary),
          bonusPayment: parseFloat(profile.bonus_payment),
          yearEndBonus: parseFloat(profile.year_end_bonus),
          transportationAllowance: parseFloat(profile.transportation_allowance),
          commission,
          mpfDeduction: profile.is_mpf_exempt ? 0 : 0.05,  // 5% MPF deduction if not exempt
        };

        // Calculate gross payment (sum of all earnings)
        const grossPayment =
          salaryData.baseSalary +
          salaryData.bonusPayment +
          salaryData.yearEndBonus +
          (salaryData.transportationAllowance || 0) +
          (salaryData.commission || 0);

        // Calculate MPF deduction (capped at 1500)
        const mpfDeductionAmount = Math.min(1500, grossPayment * salaryData.mpfDeduction);

        // Calculate net payment after deductions
        const netPayment = grossPayment - mpfDeductionAmount;

        // Check if current profile is expanded
        const isExpanded = expandedId === profile.id;

        return (
          // Employee payroll card container
          <div
            key={profile.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Clickable header to expand/collapse payroll details */}
            <button
              onClick={() => toggleExpand(profile.id)}
              className="flex items-center justify-between w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">
                    {profile.user.first_name} {profile.user.last_name}
                  </p>
                  {!profile.is_active && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{profile.role}</p>
              </div>
              <div className="text-gray-500">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {/* Expanded payroll details (shown when profile is expanded) */}
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
