import { format, isValid, parseISO } from "date-fns";
import type { EmployeeProfile } from "@interfaces/EmployeeType";

export const employeeName = ({ user }: EmployeeProfile) =>
  `${user.first_name} ${user.last_name}`.trim() || user.username;

export const employeeInitials = ({ user }: EmployeeProfile) =>
  (
    user.first_name.charAt(0) + user.last_name.charAt(0) ||
    user.username.slice(0, 2)
  ).toUpperCase();

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  CEO: "CEO",
  DIRECTOR: "Director",
  MANAGER: "Manager",
  SALESMAN: "Salesman",
  CLERK: "Clerk",
  DELIVERYMAN: "Deliveryman",
};
export const employeeRole = (role: string) => roleLabels[role] || role;

export function employmentDate(date?: string | null) {
  if (!date) return "Not set";
  const parsed = parseISO(date);
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : "Not set";
}
