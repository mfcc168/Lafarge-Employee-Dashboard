/**
 * Custom hook for easy access to permission checks
 * Provides a convenient way to check user permissions in components
 */

import { useAuth } from '@context/AuthContext';
import {
  hasRole,
  hasRoleHierarchy,
  isManagement,
  canAccessSales,
  canManageEmployees,
  canViewPayroll,
  MANAGEMENT_ROLES,
  SALES_ROLES,
  EMPLOYEE_MANAGEMENT_ROLES,
  PAYROLL_ROLES,
  UserRole,
} from '@utils/permissions';

export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  return {
    // Direct role check
    hasRole: (requiredRoles: UserRole[]) => hasRole(userRole, requiredRoles),
    
    // Hierarchy check
    hasRoleHierarchy: (minimumRole: UserRole) => hasRoleHierarchy(userRole, minimumRole),
    
    // Specific permission checks
    isManagement: () => isManagement(userRole),
    canAccessSales: () => canAccessSales(userRole),
    canManageEmployees: () => canManageEmployees(userRole),
    canViewPayroll: () => canViewPayroll(userRole),
    
    // Role constants
    MANAGEMENT_ROLES,
    SALES_ROLES,
    EMPLOYEE_MANAGEMENT_ROLES,
    PAYROLL_ROLES,
    
    // Current user role
    userRole,
  };
};