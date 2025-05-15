import { usePayrollInformation } from '@hooks/usePayrollInformation';
import LoadingSpinner from '@components/LoadingSpinner';
import PayrollInformation from '@components/PayrollInformation';
import AllEmployeePayroll from '@components/AllEmployeePayroll';

const Payroll = () => {
    const {
        salaryData,
        isLoading,
        error,
        year,
        month,
        grossPayment,
        netPayment,
        mpfDeductionAmount,
        user
    } = usePayrollInformation();
    const isManagerialRole = ["MANAGER", "ADMIN", "CEO", "DIRECTOR"].includes(user?.role || "");
    if (error) {
        return (
            <div className="max-w-md mx-auto mt-8 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            {!isManagerialRole && (
            <PayrollInformation
                salaryData={salaryData}
                grossPayment={grossPayment}
                netPayment={netPayment}
                mpfDeductionAmount={mpfDeductionAmount}
                year={year}
                month={month}
                userRole={user?.role}
            />
            )}
            {isManagerialRole && <AllEmployeePayroll />}

        </>
    );
};

export default Payroll;
