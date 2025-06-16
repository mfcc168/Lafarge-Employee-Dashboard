import { useAuth } from "@context/AuthContext";
import SalesmanMonthlyReport from "@components/SalesmanMonthlyReport";
import LoadingSpinner from "@components/LoadingSpinner";

const Sales = () => {
  const { user } = useAuth();
  const salesmanName = user?.username?.toLowerCase().trim() ?? "";
  const isManagerialRole = ["MANAGER", "ADMIN", "CEO", "DIRECTOR"].includes(user?.role || "");


  return (
    <div className="min-h-screen p-6">
      
      {(user?.role === "SALESMAN") && (
      <>
          {user?.username ? (
            <SalesmanMonthlyReport
              salesmanName={salesmanName}
            />
          ) : (
            <LoadingSpinner />
          )}
      </>
      )}

      {isManagerialRole && (
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">

            <SalesmanMonthlyReport
              salesmanName="dominic"
            />
            <br></br>
            <SalesmanMonthlyReport
              salesmanName="alex"
            />
            <br></br>
             <SalesmanMonthlyReport
              salesmanName="matthew"
            />
 
      </div>
      )}
    </div>
  );
}

export default Sales;