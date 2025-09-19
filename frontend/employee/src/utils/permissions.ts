/**
 * Centralized permission management for role-based access control.
 * This module provides consistent permission checking across the frontend.
 * Keep in sync with backend/employee/core/permissions.py
 */

// Define role types
export type UserRole = 'CEO' | 'DIRECTOR' | 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'CLERK' | 'DELIVERYMAN';

// Define role hierarchies (keep in sync with backend)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  CEO: 4,
  DIRECTOR: 3,
  ADMIN: 3, // Same level as DIRECTOR
  MANAGER: 2,
  SALESMAN: 1,
  CLERK: 0,       // Base employee level
  DELIVERYMAN: 0, // Base employee level
};

// Define role groups for common permission patterns (keep in sync with backend)
export const MANAGEMENT_ROLES: UserRole[] = ['CEO', 'DIRECTOR', 'ADMIN'];
export const SALES_ROLES: UserRole[] = ['CEO', 'DIRECTOR', 'ADMIN', 'MANAGER', 'SALESMAN'];
export const ALL_MANAGEMENT: UserRole[] = ['CEO', 'DIRECTOR', 'ADMIN', 'MANAGER'];

// Payroll access roles
export const PAYROLL_ROLES: UserRole[] = ['DIRECTOR', 'ADMIN'];

// Employee management roles
export const EMPLOYEE_MANAGEMENT_ROLES: UserRole[] = ['CEO', 'DIRECTOR', 'ADMIN'];

/**
 * Check if a user role has permission based on required roles.
 */
export const hasRole = (userRole: string | undefined, requiredRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
};

/**
 * Check if a user role meets or exceeds a minimum role level.
 */
export const hasRoleHierarchy = (userRole: string | undefined, minimumRole: UserRole): boolean => {
  if (!userRole || !(userRole in ROLE_HIERARCHY)) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole as UserRole];
  const minLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= minLevel;
};

/**
 * Check if user is in management (CEO, Director, Admin)
 */
export const isManagement = (userRole: string | undefined): boolean => {
  return hasRole(userRole, MANAGEMENT_ROLES);
};

/**
 * Check if user can access sales features
 */
export const canAccessSales = (userRole: string | undefined): boolean => {
  return hasRole(userRole, SALES_ROLES);
};

/**
 * Check if user can manage employees
 */
export const canManageEmployees = (userRole: string | undefined): boolean => {
  return hasRole(userRole, EMPLOYEE_MANAGEMENT_ROLES);
};

/**
 * Check if user can view payroll
 */
export const canViewPayroll = (userRole: string | undefined): boolean => {
  return hasRole(userRole, PAYROLL_ROLES);
};

// Centralized permission messages (keep in sync with backend)
export const PERMISSION_MESSAGES = {
  notAuthenticated: 'You must be logged in to access this page.',
  insufficientRole: 'You do not have permission to access this page.',
  noProfile: 'User profile not found. Please contact an administrator.',
  notOwner: 'You do not have permission to access this resource.',
  inactiveAccount: 'This account has been deactivated. Please contact an administrator.',
  
  // Specific action messages
  manageEmployees: 'Only administrators, directors, and CEOs can manage employees.',
  viewAllEmployees: 'Only administrators, directors, and CEOs can view all employees.',
  toggleEmployeeStatus: 'Only administrators, directors, and CEOs can change employee status.',
  updateEmployee: 'You do not have permission to update this employee profile.',
  viewPayroll: 'Only administrators and directors can view payroll information.',
  manageSales: 'Only sales team members and management can access sales data.',
  approveVacation: 'Only managers and above can approve vacation requests.',
};