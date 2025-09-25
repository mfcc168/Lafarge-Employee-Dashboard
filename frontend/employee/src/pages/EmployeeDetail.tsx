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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 animate-fadeIn">
        <div className="max-w-md w-full bg-white shadow-soft rounded-2xl p-8 animate-scaleIn border border-gray-100 text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">You do not have permission to access this page.</p>
          <button 
            onClick={() => navigate("/")}
            className="w-full py-3 px-6 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-fast font-medium shadow-md hover:shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 animate-fadeIn">
        <div className="max-w-md w-full bg-white shadow-soft rounded-2xl p-8 animate-scaleIn border border-gray-100 text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">Error loading employee details.</p>
          <button 
            onClick={() => navigate("/employees")}
            className="w-full py-3 px-6 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-fast font-medium shadow-md hover:shadow-lg"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/employees")}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold font-display mb-2">Employee Details</h1>
              <p className="text-slate-100 text-lg">Manage employee information and settings</p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
        <div></div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-fast font-medium shadow-md hover:shadow-lg"
          >
            <Edit2 size={16} />
            Edit
          </button>
        )}
      </div>

        {/* Employee Info Card */}
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-8 border border-gray-100 animate-scaleIn">
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
              ? "bg-emerald-100 text-emerald-700" 
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-100"
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
                  className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
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
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-fast font-medium shadow-md hover:shadow-lg disabled:opacity-50"
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
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-slate-50 transition-all duration-fast font-medium"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;