export type UserRole =
  | "CEO"
  | "DIRECTOR"
  | "ADMIN"
  | "MANAGER"
  | "SALESMAN"
  | "CLERK"
  | "DELIVERYMAN";

export type User = {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
  annual_leave_days: number;
  employment_date?: string | null;
};

export type ReportEntry = {
  id?: number | string;
  date: string;
  time_range: string;
  doctor_name: string;
  district: string;
  client_type: "doctor" | "nurse";
  new_client: boolean;
  orders: string;
  samples: string;
  tel_orders: string;
  new_product_intro: string;
  old_product_followup: string;
  delivery_time_update: string;
  salesman_name: string;
};

export type EmployeeProfile = {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: UserRole;
  base_salary: string;
  year_end_bonus: string;
  bonus_payment: string;
  transportation_allowance: string;
  is_mpf_exempt: boolean;
  is_active: boolean;
  annual_leave_days: number;
  employment_date?: string | null;
};

export type DateItem = {
  type: "full" | "half";
  from_date?: string;
  to_date?: string;
  single_date?: string;
  half_day_period?: "AM" | "PM";
  leave_type?: "Annual Leave" | "Sick Leave";
};

export type VacationRequest = {
  id: number;
  employee: string;
  submitted_at?: string;
  date_items: DateItem[];
  status: "pending" | "approved" | "rejected";
  signature_data: string;
};

export type ClientSummary = {
  doctor_name: string;
  district: string;
  client_type: string;
  salesman_name: string;
  visits: number;
  last_visit: string;
};

export type Invoice = {
  number: string;
  customer: string;
  care_of: string;
  sample_customer: string | null;
  salesman: string;
  total_price: number;
  delivery_date: string;
  payment_date: string | null;
  items: string[];
};

export type WeekData = {
  total: number;
  invoices: Invoice[];
};

export type SalesmanMonthlyReportData = {
  weeks: Record<number, WeekData>;
  invoice_shares_data: Invoice[];
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

export const SALES_ROLES: UserRole[] = [
  "CEO",
  "DIRECTOR",
  "ADMIN",
  "MANAGER",
  "SALESMAN",
];
export const MANAGEMENT_ROLES: UserRole[] = ["CEO", "DIRECTOR", "ADMIN"];
export const ALL_MANAGEMENT: UserRole[] = ["CEO", "DIRECTOR", "ADMIN", "MANAGER"];
export const PAYROLL_ROLES: UserRole[] = ["DIRECTOR", "ADMIN"];
