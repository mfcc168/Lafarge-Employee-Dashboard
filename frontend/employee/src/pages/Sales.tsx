import { useAuth } from "@context/AuthContext";
import { LazySalesmanMonthlyReport as SalesmanMonthlyReport } from "@components/LazyComponents";
import LoadingSpinner from "@components/LoadingSpinner";

const Sales = () => {
  const { user } = useAuth();
  const salesmanName = user?.username?.toLowerCase().trim() ?? "";
  const isManagerialRole = ["MANAGER", "ADMIN", "CEO", "DIRECTOR"].includes(user?.role || "");


  return (
    <div className="min-h-screen space-y-8 animate-fadeIn">
      {/* Sales Header */}
      <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display mb-2">
              {user?.role === "SALESMAN" ? "My Sales Performance" : "Sales Overview"}
            </h1>
            <p className="text-slate-100 text-lg">
              {user?.role === "SALESMAN" 
                ? "Track your monthly sales and commission data" 
                : "Monitor team sales performance and metrics"
              }
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Salesman View */}
      {(user?.role === "SALESMAN") && (
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-6 border border-gray-100 animate-scaleIn">
          {user?.username ? (
            <SalesmanMonthlyReport
              salesmanName={salesmanName}
            />
          ) : (
            <LoadingSpinner message="Loading your sales data..." />
          )}
        </div>
      )}

      {/* Management View */}
      {isManagerialRole && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-8 border border-gray-100 animate-scaleIn">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Dominic's Performance
                </h3>
                <SalesmanMonthlyReport salesmanName="dominic" />
              </div>
              
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Matthew's Performance
                </h3>
                <SalesmanMonthlyReport salesmanName="matthew" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;