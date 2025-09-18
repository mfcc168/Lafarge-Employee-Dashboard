import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { EmployeeProfile } from "@interfaces/EmployeeType";
import LoadingSpinner from "@components/LoadingSpinner";
import { ArrowLeft, Save, Edit2, X } from "lucide-react";

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>({});

  // Check if user has permission to view this page
  const hasPermission = ["ADMIN", "DIRECTOR"].includes(user?.role || "");

  // Fetch employee details
  const { data: employee, isLoading, error } = useQuery<EmployeeProfile>({
    queryKey: ["employee", id],
    queryFn: async () => {
      const response = await axios.get(`${backendUrl}/api/profile/${id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    },
    enabled: !!id && !!accessToken && hasPermission,
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<EmployeeProfile>) => {
      const response = await axios.patch(
        `${backendUrl}/api/profile/${id}/update/`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      queryClient.invalidateQueries({ queryKey: ["all-employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      setIsEditing(false);
    },
  });

  // Initialize form data when employee data is loaded
  useEffect(() => {
    if (employee) {
      setFormData({
        base_salary: employee.base_salary,
        transportation_allowance: employee.transportation_allowance,
        bonus_payment: employee.bonus_payment,
        year_end_bonus: employee.year_end_bonus,
        annual_leave_days: employee.annual_leave_days,
        is_mpf_exempt: employee.is_mpf_exempt,
        role: employee.role,
      });
    }
  }, [employee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (!hasPermission) {
    return (
      <div className="max-w-md mx-auto mt-6 text-red-600 font-semibold text-center">
        You do not have permission to access this page.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !employee) {
    return (
      <div className="max-w-md mx-auto mt-6 text-red-600 text-center">
        <p>Error loading employee details.</p>
        <button 
          onClick={() => navigate("/employees")}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/employees")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Employee Details</h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </button>
        )}
      </div>

      {/* Employee Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {employee.user.first_name} {employee.user.last_name}
            </h2>
            <p className="text-gray-600">@{employee.user.username}</p>
            <p className="text-gray-500">{employee.user.email}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            employee.is_active 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {employee.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="SALESMAN">Salesman</option>
                <option value="CLERK">Clerk</option>
                <option value="DELIVERYMAN">Deliveryman</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>

            {/* Base Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Salary
              </label>
              <input
                type="number"
                name="base_salary"
                value={formData.base_salary || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Transportation Allowance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transportation Allowance
              </label>
              <input
                type="number"
                name="transportation_allowance"
                value={formData.transportation_allowance || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Bonus Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bonus Payment
              </label>
              <input
                type="number"
                name="bonus_payment"
                value={formData.bonus_payment || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Year End Bonus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year End Bonus
              </label>
              <input
                type="number"
                name="year_end_bonus"
                value={formData.year_end_bonus || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Annual Leave Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Leave Days
              </label>
              <input
                type="number"
                name="annual_leave_days"
                value={formData.annual_leave_days || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* MPF Exempt */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_mpf_exempt"
                  checked={formData.is_mpf_exempt || false}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  MPF Exempt
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save size={16} />
                )}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    base_salary: employee.base_salary,
                    transportation_allowance: employee.transportation_allowance,
                    bonus_payment: employee.bonus_payment,
                    year_end_bonus: employee.year_end_bonus,
                    annual_leave_days: employee.annual_leave_days,
                    is_mpf_exempt: employee.is_mpf_exempt,
                    role: employee.role,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EmployeeDetail;