import { useState, useEffect } from "react";
import { useAuth } from "@context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, initialCheckComplete } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && initialCheckComplete) {
      navigate("/");
    }
  }, [isAuthenticated, initialCheckComplete, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      await login(username, password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Invalid credentials"
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-soft hover:shadow-strong p-8 space-y-6 animate-scaleIn transition-all duration-normal">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 font-display">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your Lafarge Dashboard</p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl text-sm bg-error-50 text-error-700 border border-error-200 animate-shake">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-error-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-20 outline-none transition-colors duration-fast placeholder-gray-400 text-gray-900"
              required
              autoFocus
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-20 outline-none transition-colors duration-fast placeholder-gray-400 text-gray-900"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-fast disabled:opacity-60 disabled:cursor-not-allowed hover:animate-buttonHover font-medium text-lg shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            Secure access to your employee dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;