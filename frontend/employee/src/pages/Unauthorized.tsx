import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message || "You don't have permission to access this page.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 animate-fadeIn">
      <div className="max-w-md w-full bg-white shadow-soft rounded-2xl p-8 animate-scaleIn border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-error-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2 font-display">
          Access Denied
        </h1>
        
        <p className="text-slate-600 text-center mb-8">
          {message}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-6 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-fast font-medium shadow-md hover:shadow-lg"
          >
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 px-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-fast font-medium shadow-md hover:shadow-lg"
          >
            Go to Home
          </button>
        </div>
        
        <p className="text-sm text-slate-500 text-center mt-8">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;