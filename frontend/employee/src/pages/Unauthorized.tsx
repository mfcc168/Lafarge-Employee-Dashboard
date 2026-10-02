import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const message =
    location.state?.message || "You don't have permission to access this page.";

  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-gray-100">
      <div className="surface max-w-md w-full p-8 border">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-gray-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2 font-display">
          Access Denied
        </h1>

        <p className="text-gray-600 text-center mb-8">{message}</p>

        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-6 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-fast font-medium shadow-md "
          >
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3 px-6 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-fast font-medium shadow-md "
          >
            Go to Home
          </button>
        </div>

        <p className="text-sm text-gray-600 text-center mt-8">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;
