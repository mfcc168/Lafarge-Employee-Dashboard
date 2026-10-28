import { useState, useEffect } from "react";
import { useAuth } from "@context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, AlertCircle } from "lucide-react";
import PasswordField from "@components/PasswordField";
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, initialCheckComplete } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated && initialCheckComplete) navigate("/");
  }, [isAuthenticated, initialCheckComplete, navigate]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username || !password || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(username, password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Please check your username and password.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="auth-page">
      <section className="auth-intro">
        <div className="brand">
          <span className="brand-mark">
            L<span>.</span>
          </span>
          <span>
            Lafarge<small>EMPLOYEE WORKSPACE</small>
          </span>
        </div>
        <div>
          <span className="eyebrow">A LITTLE SPACE TO FOCUS</span>
          <h1>
            Your workday,
            <br />
            beautifully organized.
          </h1>
          <p>
            From daily reports to time off. Everything you need for a more
            considered workday.
          </p>
          <div className="auth-art" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <p className="text-xs">Lafarge · Employee workspace</p>
      </section>
      <section className="auth-card surface">
        <p className="eyebrow">GOOD TO SEE YOU</p>
        <h2>Welcome back.</h2>
        <p className="page-description">Sign in to your workspace.</p>
        {errorMessage && (
          <p role="alert" className="notice mt-6">
            <AlertCircle size={18} />
            {errorMessage}
          </p>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="button button-primary"
            aria-busy={isLoading}
          >
            {isLoading ? "Signing in…" : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="auth-footnote">
          <LockKeyhole size={14} />
          Your personal employee workspace
        </p>
      </section>
    </div>
  );
}
