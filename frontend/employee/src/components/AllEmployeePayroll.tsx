import { useEffect, useMemo, useState } from "react";
import { EmployeeProfile } from "interfaces/index";
import axios from "axios";
import PayrollInformation from "./PayrollInformation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@context/AuthContext";
import { apiUrl } from "@configs/DotEnv";
import LoadingSpinner from "@components/LoadingSpinner";

const AllEmployeePayroll = () => {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [commissions, setCommissions] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const { user, accessToken } = useAuth();

  const [year, month, prevYear, prevMonth] = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const y = today.getFullYear();
    const m = today.getMonth() + 1; // 1-based
  
    // Payroll Month/Year
    const isBeforeSalaryDay = day < 10;
    const payrollMonth = isBeforeSalaryDay ? (m === 1 ? 12 : m - 1) : m;
    const payrollYear = isBeforeSalaryDay && m === 1 ? y - 1 : y;
  
    // Commission should be 1 month BEFORE payroll month (which is now already "adjusted")
    let commissionMonth = payrollMonth - 1;
    let commissionYear = payrollYear;
    if (commissionMonth === 0) {
      commissionMonth = 12;
      commissionYear -= 1;
    }
  
    return [payrollYear, payrollMonth, commissionYear, commissionMonth];
  }, []);
  
  
  
  

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        // Fetch all employee salaries
        const res = await axios.get<EmployeeProfile[]>(
          `http://127.0.0.1:8000/api/get_all_employee_salary/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        setProfiles(res.data);

        // Fetch all commissions from backend
        const commissionRes = await axios.get(
          `${apiUrl}/salesmen/commissions/${prevYear}/${prevMonth}/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const nameToUsernameMap: Record<string, string> = {
          "Dominic So": "dominic",
          "Alex Cheung": "alex",
          "Matthew Mak": "matthew",
        };

        const commissionMap: Record<string, number> = {};
        commissionRes.data.forEach(
          (entry: { salesman: string; commission: number }) => {
            const username = nameToUsernameMap[entry.salesman];
            if (username) {
              commissionMap[username] = entry.commission;
            }
          }
        );

        setCommissions(commissionMap);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load payroll or commissions", error);
        setIsLoading(false);
      }
    };

    fetchPayroll();
  }, [accessToken, year, month]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN" && user.role !== "CEO")) {
    return (
      <div className="max-w-md mx-auto mt-6 text-red-600 font-semibold">
        You do not have permission to view all employee payrolls.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">All Employee Payrolls</h1>
      {profiles.map((profile) => {
        const commission = commissions[profile.user.username] || 0;

        const salaryData = {
          baseSalary: parseFloat(profile.base_salary),
          bonusPayment: parseFloat(profile.bonus_payment),
          transportationAllowance: parseFloat(profile.transportation_allowance),
          commission,
          mpfDeduction: profile.is_mpf_exempt ? 0 : 0.05,
        };

        const grossPayment =
          salaryData.baseSalary +
          salaryData.bonusPayment +
          (salaryData.transportationAllowance || 0) +
          (salaryData.commission || 0);

        const mpfDeductionAmount = grossPayment * salaryData.mpfDeduction;
        const netPayment = grossPayment - mpfDeductionAmount;

        const isExpanded = expandedId === profile.id;

        return (
          <div
            key={profile.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(profile.id)}
              className="flex items-center justify-between w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  {profile.user.first_name} {profile.user.last_name}
                </p>
                <p className="text-sm text-gray-600">{profile.role}</p>
              </div>
              <div className="text-gray-500">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-6 bg-white border-t border-gray-200">
                <PayrollInformation
                  salaryData={salaryData}
                  grossPayment={grossPayment}
                  netPayment={netPayment}
                  mpfDeductionAmount={mpfDeductionAmount}
                  year={year}
                  month={month}
                  userRole={profile.role}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AllEmployeePayroll;
