import { WeekData } from "./index";

export type SalesmanMonthlyReportData = {
    weeks: Record<number, WeekData>;
    year: number;
    month: number;
    monthly_total: number;
    salesman: string;
    commission: number;
    monthly_total_share: number;
    monthly_total_share_percentage: number;
    personal_monthly_total_share: number;
    sales_monthly_total: number;
    incentive_percentage: number;
};