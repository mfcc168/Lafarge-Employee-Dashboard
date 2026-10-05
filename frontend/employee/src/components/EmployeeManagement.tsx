import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { EmployeeProfile } from "@interfaces/EmployeeType";
import LoadingSpinner from "@components/LoadingSpinner";
import { UserX, UserCheck, AlertCircle } from "lucide-react";
import SearchField from "@components/SearchField";
import { Link } from "react-router-dom";
import { canManageEmployees, PERMISSION_MESSAGES } from "@utils/permissions";

const EmployeeManagement = () => {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all employees (including inactive)
  const {
    data: employees,
    isLoading,
    error,
  } = useQuery<EmployeeProfile[]>({
    queryKey: ["all-employees", accessToken],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/employees/all/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    enabled: !!user && canManageEmployees(user.role) && !!accessToken,
  });

  // Toggle employee status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await axios.post(
        `${backendUrl}/api/profile/${profileId}/toggle-status/`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch employees
      queryClient.invalidateQueries({ queryKey: ["all-employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  // Check authorization
  if (!user || !canManageEmployees(user.role)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-100">
        <div className="surface max-w-md w-full p-8 border text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 font-semibold">
            {PERMISSION_MESSAGES.manageEmployees}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-100">
        <div className="surface max-w-md w-full p-8 border text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">
            Error loading employees. Please try again.
          </p>
        </div>
      </div>
    );
  }

  // First filter out management roles from all employees
  const nonManagementEmployees =
    employees?.filter((employee) => {
      return !["ADMIN", "CEO", "DIRECTOR"].includes(employee.role);
    }) || [];

  // Then filter based on search term
  const filteredEmployees = nonManagementEmployees.filter((employee) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      employee.user.username.toLowerCase().includes(searchLower) ||
      employee.user.first_name.toLowerCase().includes(searchLower) ||
      employee.user.last_name.toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower)
    );
  });

  // Separate active and inactive employees (from all non-management, not just filtered)
  const activeEmployees = nonManagementEmployees.filter((emp) => emp.is_active);
  const inactiveEmployees = nonManagementEmployees.filter(
    (emp) => !emp.is_active,
  );

  // For display purposes, get active/inactive from filtered results
  const filteredActiveEmployees = filteredEmployees.filter(
    (emp) => emp.is_active,
  );
  const filteredInactiveEmployees = filteredEmployees.filter(
    (emp) => !emp.is_active,
  );

  const renderEmployeeCard = (employee: EmployeeProfile) => (
    <div
      key={employee.id}
      className={`
        employee-card surface p-5
        ${employee.is_active ? "bg-white" : "bg-gray-100"}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">
              <Link
                className="employee-profile-link"
                to={`/employees/${employee.id}`}
              >
                {employee.user.first_name} {employee.user.last_name}
              </Link>
            </h3>
            {!employee.is_active && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">@{employee.user.username}</p>
          <p className="text-sm text-gray-600">{employee.role}</p>
          {employee.role === "SALESMAN" && (
            <p className="text-xs text-gray-600 mt-1">
              Sales reports and commissions{" "}
              {employee.is_active ? "active" : "disabled"}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigation when clicking the toggle button
            toggleStatusMutation.mutate(employee.id);
          }}
          disabled={toggleStatusMutation.isPending}
          className={`
            p-3 rounded-lg transition-colors duration-200
            ${
              employee.is_active
                ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={`${employee.is_active ? "Deactivate" : "Activate"} ${employee.user.first_name} ${employee.user.last_name}`}
          title={
            employee.is_active ? "Deactivate employee" : "Activate employee"
          }
        >
          {toggleStatusMutation.isPending ? (
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          ) : employee.is_active ? (
            <UserX size={20} />
          ) : (
            <UserCheck size={20} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Team directory</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {nonManagementEmployees.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Active</span>
            <span className="text-lg font-bold text-gray-900">
              {activeEmployees.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Inactive</span>
            <span className="text-lg font-bold text-gray-900">
              {inactiveEmployees.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <SearchField
        id="employee-search"
        label="Search employees"
        placeholder="Name, username, role"
        value={searchTerm}
        onValueChange={setSearchTerm}
        clearLabel="Clear employee search"
        className="employee-search-field"
      />

      <details className="usage-note">
        <summary>About employee access</summary>
        <p>
          Deactivating an employee prevents sign-in and hides their reports and
          payroll. You can reactivate them at any time.
        </p>
      </details>

      {/* Active employees */}
      {filteredActiveEmployees.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Active Employees ({filteredActiveEmployees.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActiveEmployees.map(renderEmployeeCard)}
          </div>
        </div>
      )}

      {/* Inactive employees */}
      {filteredInactiveEmployees.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Inactive Employees ({filteredInactiveEmployees.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInactiveEmployees.map(renderEmployeeCard)}
          </div>
        </div>
      )}

      {filteredEmployees.length === 0 && searchTerm && (
        <div className="text-center text-gray-600 py-8">
          No employees found matching "{searchTerm}"
        </div>
      )}

      {nonManagementEmployees.length === 0 && !searchTerm && (
        <div className="text-center text-gray-600 py-8">
          No employees to manage. Only regular employees (non-management) are
          shown here.
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
