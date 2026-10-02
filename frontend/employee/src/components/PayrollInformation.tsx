import { useState } from "react";
import { PayrollInformationProps } from "@interfaces/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { backendUrl } from "@configs/DotEnv";

/**
 * PayrollInformation Component
 *
 * Displays and manages employee payroll information with:
 * - View and edit modes for salary components
 * - Real-time calculation of gross/net payments
 * - MPF deduction handling
 * - Role-based field visibility (e.g., commission for sales)
 *
 * @param {PayrollInformationProps} props - Component properties
 * returns Payroll information interface
 */
const PayrollInformation = ({
  salaryData,
  grossPayment,
  netPayment,
  mpfDeductionAmount,
  year,
  month,
  userRole,
  employeeId,
}: PayrollInformationProps) => {
  // Component state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    baseSalary: salaryData.baseSalary || 0,
    bonusPayment: salaryData.bonusPayment || 0,
    yearEndBonus: salaryData.yearEndBonus || 0,
    transportationAllowance: salaryData.transportationAllowance || 0,
    commission: salaryData.commission || 0,
    mpfDeduction: salaryData.mpfDeduction || 0,
  });

  // Authentication and data management
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Mutation for updating salary information
   */
  const { mutate: updateSalary, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: {
      base_salary: number;
      bonus_payment: number;
      year_end_bonus: number;
      transportation_allowance: number;
      commission?: number;
    }) => {
      const response = await axios.patch(
        `${backendUrl}/api/profile/${employeeId}/update/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      // Refresh salary data after successful update
      queryClient.invalidateQueries({
        queryKey: ["employee-salaries"],
      });
      setIsEditing(false);
    },
    onError: (e: unknown) => {
      console.error("Failed to update salary:", e);
    },
  });

  // UI Handlers
  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleChange = (field: string, value: number) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const payload = {
      base_salary: editData.baseSalary,
      bonus_payment: editData.bonusPayment,
      year_end_bonus: editData.yearEndBonus,
      transportation_allowance: editData.transportationAllowance,
      ...(userRole === "SALESMAN" && { commission: editData.commission }),
    };
    updateSalary(payload);
  };

  const handleCancel = () => {
    // Reset to original values
    setEditData({
      baseSalary: salaryData.baseSalary || 0,
      bonusPayment: salaryData.bonusPayment || 0,
      yearEndBonus: salaryData.yearEndBonus || 0,
      transportationAllowance: salaryData.transportationAllowance || 0,
      commission: salaryData.commission || 0,
      mpfDeduction: salaryData.mpfDeduction || 0,
    });
    setIsEditing(false);
  };

  /**
   * Renders a field in either editable or view mode
   * @param {string} label - Field display label
   * @param {string} field - Field key in state
   * @param {number} value - Current field value
   * @param {boolean} isEditable - Whether field can be edited
   * returns Field component
   */
  const renderEditableField = (
    label: string,
    field: string,
    value: number,
    isEditable = true,
  ) => {
    if (!isEditable && isEditing) return null;

    return isEditing && isEditable ? (
      <div className="space-y-2">
        <label
          htmlFor={`payroll-${employeeId}-${field}`}
          className="text-gray-700 font-medium block"
        >
          {label}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
            $
          </span>
          <input
            id={`payroll-${employeeId}-${field}`}
            type="number"
            className="money-input w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none bg-white transition-colors duration-200 font-medium"
            value={value}
            onChange={(e) =>
              handleChange(field, parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
          />
        </div>
      </div>
    ) : (
      <div className="space-y-2">
        <p className="text-gray-600 font-medium">{label}</p>
        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <p className="font-bold text-gray-800 text-lg">
            $
            {value?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with gradient icon */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-md">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Payroll details
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              {new Date(year, month - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-2  bg-gray-800    text-white px-4 py-2 rounded-xl shadow-md  transition-colors duration-200 font-medium"
            aria-label="Edit payroll information"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2  bg-gray-800    disabled:bg-gray-800 disabled: text-white px-4 py-2 rounded-xl shadow-md  transition-colors duration-200 font-medium min-w-[100px]"
              aria-label="Save changes"
            >
              {isUpdating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2  bg-gray-800    text-white px-4 py-2 rounded-xl shadow-md  transition-colors duration-200 font-medium"
              aria-label="Cancel editing"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Salary Details Section */}
      <div className="surface border transition-colors duration-200 overflow-hidden">
        <div className="bg-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-lg font-bold text-white">Salary Components</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderEditableField(
              "Base Salary",
              "baseSalary",
              editData.baseSalary,
            )}
            {renderEditableField(
              "Bonus Payment",
              "bonusPayment",
              editData.bonusPayment,
            )}
            {renderEditableField(
              "Year End Bonus",
              "yearEndBonus",
              editData.yearEndBonus,
            )}
            {renderEditableField(
              "Transportation Allowance",
              "transportationAllowance",
              editData.transportationAllowance,
            )}
            {userRole === "SALESMAN" &&
              renderEditableField(
                "Commission",
                "commission",
                editData.commission,
                false,
              )}
          </div>
        </div>
      </div>

      {/* Enhanced Payment Summary Section */}
      <div className="surface border transition-colors duration-200 overflow-hidden">
        <div className="bg-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h2 className="text-lg font-bold text-white">Payment Summary</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Gross Payment</span>
              <span className="text-lg font-bold text-gray-800">
                $
                {grossPayment.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">MPF Deduction</span>
              <span className="text-lg font-bold text-gray-600">
                -$
                {mpfDeductionAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-bold text-lg">
                  Net Payment
                </span>
                <span className="text-2xl font-bold text-gray-700">
                  $
                  {netPayment.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollInformation;
