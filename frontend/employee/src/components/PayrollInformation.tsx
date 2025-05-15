import { PayrollInformationProps } from '@interfaces/index';


const PayrollInformation = ({
    salaryData,
    grossPayment,
    netPayment,
    mpfDeductionAmount,
    year,
    month,
    userRole
}: PayrollInformationProps) => {
    
    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Payroll Information</h1>
            
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Salary Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">Base salary</p>
                            <p className="font-medium">${salaryData.baseSalary?.toFixed(2)}</p>
                        </div>
                        {salaryData.bonusPayment != null  && salaryData.bonusPayment > 0 && (
                        <div>
                            <p className="text-gray-600">Bonus</p>
                            <p className="font-medium">${salaryData.bonusPayment?.toFixed(2)}</p>
                        </div>
                        )}
                        {salaryData.transportationAllowance != null  && salaryData.transportationAllowance > 0 && (
                        <div>
                            <p className="text-gray-600">Transportation allowance</p>
                            <p className="font-medium">${salaryData.transportationAllowance?.toFixed(2)}</p>
                        </div>
                        )}
                        {userRole === "SALESMAN" && (
                            <div>
                                <p className="text-gray-600">Commission</p>
                                <p className="font-medium">${salaryData.commission?.toFixed(2)}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-gray-600">MPF deduction rate</p>
                            <p className="font-medium">{(salaryData.mpfDeduction || 0) * 100}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-blue-700 mb-3">Payment Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <p className="text-gray-600">Gross payment:</p>
                            <p className="font-medium">${grossPayment.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-gray-600">MPF deduction:</p>
                            <p className="font-medium text-red-500">-${mpfDeductionAmount.toFixed(2)}</p>
                        </div>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="flex justify-between">
                            <p className="text-gray-600 font-semibold">Net payment:</p>
                            <p className="font-bold text-blue-600">${netPayment.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-gray-500 mt-4">
                    <p>For period: {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>
        </div>
    );
};

export default PayrollInformation;