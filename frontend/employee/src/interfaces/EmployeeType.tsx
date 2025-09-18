export type EmployeeUser = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  }
  
export type EmployeeProfile = {
    id: number;
    user: EmployeeUser;
    role: string;
    base_salary: string;
    year_end_bonus: string;
    bonus_payment: string;
    transportation_allowance: string;
    is_mpf_exempt: boolean;
    is_active: boolean;
    annual_leave_days: number;
  }
  