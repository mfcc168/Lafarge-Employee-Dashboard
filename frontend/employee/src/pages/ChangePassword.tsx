import { useState } from "react";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "@configs/DotEnv";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/api/change-password/`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.detail || "Failed to change password");
      } else {
        setErrorMessage("Failed to change password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-soft hover:shadow-strong p-8 space-y-6 animate-scaleIn transition-all duration-normal border border-gray-100">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 font-display">Change Password</h2>
          <p className="text-gray-600">Update your account password</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-md text-sm bg-error-100 text-error-700 border border-error-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-20 outline-none transition-colors duration-fast"
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-20 outline-none transition-colors duration-fast"
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-20 outline-none transition-colors duration-fast"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-600 text-white hover:bg-slate-700 transition-all duration-fast font-medium shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
