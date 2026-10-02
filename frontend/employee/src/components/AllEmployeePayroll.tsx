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
  if (
    !user ||
    (user.role !== "MANAGER" &&
      user.role !== "ADMIN" &&
      user.role !== "CEO" &&
      user.role !== "DIRECTOR")
  ) {
    return (
      <div className="max-w-md mx-auto mt-6 text-gray-600 font-semibold">
        You do not have permission to view all employee payrolls.
      </div>
    );
  }

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Calculate total net payroll for active employees
  const totalNetPayroll = profiles
    .filter((profile) => profile.is_active) // Only active employees
    .reduce((total, profile) => {
      const commission = commissions[profile.user.username] || 0;
      const grossPayment =
        parseFloat(profile.base_salary) +
        parseFloat(profile.bonus_payment) +
        parseFloat(profile.year_end_bonus) +
        (parseFloat(profile.transportation_allowance) || 0) +
        (commission || 0);

      const mpfDeduction = profile.is_mpf_exempt ? 0 : 0.05;
      const mpfDeductionAmount = Math.min(1500, grossPayment * mpfDeduction);
      const netPayment = grossPayment - mpfDeductionAmount;

      return total + netPayment;
    }, 0);

  const activeEmployeeCount = profiles.filter(
    (profile) => profile.is_active,
  ).length;

  return (
    <div className="space-y-8">
      {/* Total Payroll Summary */}
      <div className="surface bg-gray-100 border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Total Net Payroll
            </h2>
            <p className="text-gray-600 text-sm">
              For {activeEmployeeCount} active employee
              {activeEmployeeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-gray-600">
              $
              {totalNetPayroll.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {new Date(year, month - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="section-bar">
        <div>
          <h2>Employee payslips</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select an employee to view their breakdown.
          </p>
        </div>
        <button
          onClick={() => handleViewPayrollPDF()}
          className="button"
          aria-label="Print All Payslips"
        >
          <Printer size={18} />
          Print all
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
          mpfDeduction: profile.is_mpf_exempt ? 0 : 0.05, // 5% MPF deduction if not exempt
        };

        // Calculate gross payment (sum of all earnings)
        const grossPayment =
          salaryData.baseSalary +
          salaryData.bonusPayment +
          salaryData.yearEndBonus +
          (salaryData.transportationAllowance || 0) +
          (salaryData.commission || 0);

        // Calculate MPF deduction (capped at 1500)
        const mpfDeductionAmount = Math.min(
          1500,
          grossPayment * salaryData.mpfDeduction,
        );

        // Calculate net payment after deductions
        const netPayment = grossPayment - mpfDeductionAmount;

        // Check if current profile is expanded
        const isExpanded = expandedId === profile.id;

        return (
          // Enhanced Employee payroll card container
          <div
            key={profile.id}
            className="surface transition-colors duration-150 overflow-hidden border"
          >
            {/* Clickable header to expand/collapse payroll details */}
            <button
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(profile.id)}
              className="flex items-center justify-between w-full px-8 py-6 text-left  bg-gray-100    transition-colors duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-white shadow-md">
                  {/* Universal person icon for all roles */}
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-bold text-gray-800 text-lg">
                      {profile.user.last_name} {profile.user.first_name}
                    </p>
                    {!profile.is_active && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                      {profile.role}
                    </span>
                    <span className="text-sm text-gray-600 font-medium">
                      Net: $
                      {netPayment.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-gray-600">
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded payroll details (shown when profile is expanded) */}
            {isExpanded && (
              <div className="payroll-details">
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
