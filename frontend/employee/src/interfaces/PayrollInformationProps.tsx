import { SalaryData } from "./index";

export interface PayrollInformationProps {
    salaryData: SalaryData;
    grossPayment: number;
    netPayment: number;
    mpfDeductionAmount: number;
    year: number;
    month: number;
    userRole?: string;
    employeeId?: number;
};