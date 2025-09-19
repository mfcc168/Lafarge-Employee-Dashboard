import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message || "You don't have permission to access this page.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            Go to Home
          </button>
        </div>
        
        <p className="text-sm text-gray-500 text-center mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;