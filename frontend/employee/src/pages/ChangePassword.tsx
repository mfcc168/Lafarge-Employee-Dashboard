import PageHeader from "@components/PageHeader";
import PasswordField from "@components/PasswordField";
import { useToast } from "@context/ToastContext";
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
  const { showSuccess } = useToast();

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
        },
      );
      showSuccess("Password updated", "Your new password is ready to use.");
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.detail || "Failed to change password",
        );
      } else {
        setErrorMessage("Failed to change password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Change password"
        description="Keep your account secure with a strong, unique password."
      />
      <section className="surface settings-card">
        {errorMessage && (
          <p className="notice mb-6" role="alert">
            {errorMessage}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <div className="page-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={isLoading}
            >
              {isLoading ? "Updating password…" : "Update password"}
            </button>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
export default ChangePassword;
