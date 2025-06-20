import { useState } from 'react';
import { PayrollInformationProps } from '@interfaces/index';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { backendUrl } from '@configs/DotEnv';

const PayrollInformation = ({
    salaryData,
    grossPayment,
    netPayment,
    mpfDeductionAmount,
    year,
    month,
    userRole,
    employeeId
}: PayrollInformationProps ) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editData, setEditData] = useState({
        baseSalary: salaryData.baseSalary || 0,
        bonusPayment: salaryData.bonusPayment || 0,
        yearEndBonus: salaryData.yearEndBonus || 0,
        transportationAllowance: salaryData.transportationAllowance || 0,
        commission: salaryData.commission || 0,
        mpfDeduction: salaryData.mpfDeduction || 0
    });

    const { accessToken } = useAuth();

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleChange = (field: string, value: number) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };


    const handleSave = async () => {
        setIsLoading(true);
        try {
            const payload = {
                base_salary: editData.baseSalary,
                bonus_payment: editData.bonusPayment,
                year_end_bonus: editData.yearEndBonus,
                transportation_allowance: editData.transportationAllowance,
                ...(userRole === 'SALESMAN' && { commission: editData.commission })
            };

            await axios.patch(
                `${backendUrl}/api/profile/${employeeId}/update/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            setIsEditing(false);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };


    const handleCancel = () => {
        setEditData({
            baseSalary: salaryData.baseSalary || 0,
            bonusPayment: salaryData.bonusPayment || 0,
            yearEndBonus: salaryData.yearEndBonus || 0,
            transportationAllowance: salaryData.transportationAllowance || 0,
            commission: salaryData.commission || 0,
            mpfDeduction: salaryData.mpfDeduction || 0
        });
        setIsEditing(false);
    };

    const renderEditableField = (label: string, field: string, value: number, isEditable = true) => {
        if (!isEditable && isEditing) return null;
        
        return isEditing && isEditable ? (
            <div>
                <label className="text-gray-600 block">{label}</label>
                <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={value}
                    onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                />
            </div>
        ) : (
            <div>
                <p className="text-gray-600">{label}</p>
                <p className="font-medium">${value?.toFixed(2)}</p>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Payroll Information</h1>
                {!isEditing ? (
                    <button 
                        onClick={handleEditToggle}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Edit
                    </button>
                ) : (
                    <div className="space-x-2">
                        <button 
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 items-center justify-center min-w-[100px]"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin h-3 w-3 mr-2 relative top-[1px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </div>
                            ) : "Save"}
                        </button>
                        <button 
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
            
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Salary Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderEditableField("Base salary", "baseSalary", editData.baseSalary)}
                        
                        {
                            renderEditableField("Bonus", "bonusPayment", editData.bonusPayment)
                        }
                        {
                            renderEditableField("Year End Bonus", "yearEndBonus", editData.yearEndBonus)
                        }
                        
                        
                        {
                            renderEditableField("Transportation allowance", "transportationAllowance", editData.transportationAllowance)
                        }
                        
                        {(userRole === "SALESMAN") && (renderEditableField("Commission", "commission", editData.commission, false))}
                        
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