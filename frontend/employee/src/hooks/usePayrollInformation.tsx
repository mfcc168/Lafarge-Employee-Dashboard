import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { apiUrl, backendUrl } from '@configs/DotEnv';
import { SalaryData, PaymentCalculations } from '@interfaces/index';

export const usePayrollInformation = () => {
    const [salaryData, setSalaryData] = useState<SalaryData>({
        baseSalary: null,
        bonusPayment: null,
        yearEndBonus: null,
        transportationAllowance: null,
        mpfDeduction: null,
        commission: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user, accessToken } = useAuth();


    const [year, month, prevYear, prevMonth] = useMemo(() => {
        const today = new Date();
        const day = today.getDate();
        const y = today.getFullYear();
        const m = today.getMonth() + 1; // 1-12 based
      
        // Payroll Month/Year
        const isBeforeSalaryDay = day < 10;
        const payrollMonth = isBeforeSalaryDay ? (m === 1 ? 12 : m - 1) : m;
        const payrollYear = isBeforeSalaryDay && m === 1 ? y - 1 : y;
      
        // Commission should be 1 month BEFORE payroll month
        let commissionMonth = payrollMonth - 1;
        let commissionYear = payrollYear;
        if (commissionMonth === 0) {
          commissionMonth = 12;
          commissionYear -= 1;
        }
      
        return [payrollYear, payrollMonth, commissionYear, commissionMonth];
      }, []);

    const { grossPayment, netPayment, mpfDeductionAmount }: PaymentCalculations = useMemo(() => {
        const base = salaryData.baseSalary || 0;
        const bonusPayment = salaryData.bonusPayment || 0;
        const yearEndBonus = salaryData.yearEndBonus || 0;
        const transport = salaryData.transportationAllowance || 0;
        const commission = salaryData.commission || 0;
        const mpfRate = salaryData.mpfDeduction || 0;

        const gross = base + transport + commission + bonusPayment + yearEndBonus;
        const mpfDeductionAmount = gross * mpfRate;
        const net = gross - mpfDeductionAmount;

        return {
            grossPayment: gross,
            netPayment: net,
            mpfDeductionAmount
        };
    }, [salaryData]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const requests = [
                    axios.get(`${backendUrl}/api/salary/me`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    })
                ];

                if (user?.role === "SALESMAN") {
                    requests.push(
                        axios.get(`${apiUrl}/salesman/${user.username}/monthly/${prevYear}/${prevMonth}/`, {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        })
                    );
                }


                const [salaryResponse, commissionResponse] = await Promise.all(requests);

                setSalaryData({
                    baseSalary: salaryResponse.data.base_salary,
                    bonusPayment: salaryResponse.data.bonus_payment,
                    yearEndBonus: salaryResponse.data.year_end_bonus,
                    transportationAllowance: salaryResponse.data.transportation_allowance,
                    mpfDeduction: salaryResponse.data.is_mpf_exempt ? 0 : 0.05,
                    commission: commissionResponse?.data?.commission || null
                });

            } catch (err) {
                setError('Failed to fetch salary data. Please try again later.');
                console.error('API Error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, accessToken, year, month]);

    return {
        salaryData,
        isLoading,
        error,
        year,
        month,
        grossPayment,
        netPayment,
        mpfDeductionAmount,
        user
    };
};