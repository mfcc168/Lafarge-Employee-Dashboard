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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-display">All Employee Payrolls</h1>
          <p className="text-slate-500 font-medium">Manage employee compensation and benefits</p>
        </div>
        {/* Print button */}
        <button
          onClick={() => handleViewPayrollPDF()}
          className="ml-auto flex items-center gap-2 bg-gradient-to-br from-slate-600 to-emerald-600 hover:from-slate-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          aria-label="Print All Payslips"
          title="Print All Payslips"
        >
          <Printer size={20} />
          <span className="font-medium">Print All</span>
        </button>
      </div>

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
          // Enhanced Employee payroll card container
          <div
            key={profile.id}
            className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-300 overflow-hidden border border-slate-100"
          >
            {/* Clickable header to expand/collapse payroll details */}
            <button
              onClick={() => toggleExpand(profile.id)}
              className="flex items-center justify-between w-full px-8 py-6 text-left bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
                  {/* Universal person icon for all roles */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-slate-800 text-lg">
                      {profile.user.last_name} {profile.user.first_name}
                    </p>
                    {!profile.is_active && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg">
                      {profile.role}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      Net: ${netPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </button>
            
            {/* Expanded payroll details (shown when profile is expanded) */}
            {isExpanded && (
              <div className="p-8 bg-white border-t border-slate-200">
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
