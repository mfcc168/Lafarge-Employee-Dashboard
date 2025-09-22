import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { EmployeeProfile } from "@interfaces/EmployeeType";
import LoadingSpinner from "@components/LoadingSpinner";
import { UserX, UserCheck, AlertCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canManageEmployees, PERMISSION_MESSAGES } from "@utils/permissions";

const EmployeeManagement = () => {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all employees (including inactive)
  const { data: employees, isLoading, error } = useQuery<EmployeeProfile[]>({
    queryKey: ["all-employees", accessToken],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/employees/all/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    },
    enabled: !!user && canManageEmployees(user.role) && !!accessToken,
  });

  // Toggle employee status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await axios.post(`${backendUrl}/api/profile/${profileId}/toggle-status/`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch employees
      queryClient.invalidateQueries({ queryKey: ["all-employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
    },
  });

  // Check authorization
  if (!user || !canManageEmployees(user.role)) {
    return (
      <div className="max-w-md mx-auto mt-6 text-red-600 font-semibold">
        {PERMISSION_MESSAGES.manageEmployees}
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-6 text-red-600">
        Error loading employees. Please try again.
      </div>
    );
  }

  // First filter out management roles from all employees
  const nonManagementEmployees = employees?.filter((employee) => {
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
  const activeEmployees = nonManagementEmployees.filter(emp => emp.is_active);
  const inactiveEmployees = nonManagementEmployees.filter(emp => !emp.is_active);
  
  // For display purposes, get active/inactive from filtered results
  const filteredActiveEmployees = filteredEmployees.filter(emp => emp.is_active);
  const filteredInactiveEmployees = filteredEmployees.filter(emp => !emp.is_active);

  const EmployeeCard = ({ employee }: { employee: EmployeeProfile }) => (
    <div
      className={`
        p-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer
        ${employee.is_active 
          ? "bg-white" 
          : "bg-gray-50 opacity-75"
        }
      `}
      onClick={() => navigate(`/employees/${employee.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {employee.user.first_name} {employee.user.last_name}
            </h3>
            {!employee.is_active && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">@{employee.user.username}</p>
          <p className="text-sm text-gray-500">{employee.role}</p>
          {employee.role === "SALESMAN" && (
            <p className="text-xs text-gray-400 mt-1">
              Sales reports and commissions {employee.is_active ? "active" : "disabled"}
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
            p-3 rounded-lg transition-all duration-200
            ${employee.is_active
              ? "bg-red-100 hover:bg-red-200 text-red-600"
              : "bg-green-100 hover:bg-green-200 text-green-600"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={employee.is_active ? "Deactivate employee" : "Activate employee"}
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">{nonManagementEmployees.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Active</span>
            <span className="text-lg font-bold text-green-900">{activeEmployees.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium text-red-700">Inactive</span>
            <span className="text-lg font-bold text-red-900">{inactiveEmployees.length}</span>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, username, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            block w-full pl-10 pr-4 py-3 
            border border-gray-200 rounded-xl 
            bg-gray-50 
            text-gray-900 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white
            transition-all duration-200
            text-sm
          "
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Warning message */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-amber-600 mt-0.5" size={20} />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Deactivating an employee will prevent them from logging in</li>
            <li>Inactive salesmen's reports will be hidden from views</li>
            <li>Inactive employees won't appear in payroll lists</li>
            <li>You can reactivate employees at any time</li>
          </ul>
        </div>
      </div>

      {/* Active employees */}
      {filteredActiveEmployees.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Active Employees ({filteredActiveEmployees.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActiveEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
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
            {filteredInactiveEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        </div>
      )}

      {filteredEmployees.length === 0 && searchTerm && (
        <div className="text-center text-gray-500 py-8">
          No employees found matching "{searchTerm}"
        </div>
      )}
      
      {nonManagementEmployees.length === 0 && !searchTerm && (
        <div className="text-center text-gray-500 py-8">
          No employees to manage. Only regular employees (non-management) are shown here.
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;