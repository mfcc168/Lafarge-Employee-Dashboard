"""
Centralized permission management for role-based access control.
This module provides consistent permission checking across the application.
"""

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from functools import wraps
from typing import List, Optional


# Define role hierarchies and permissions
ROLE_HIERARCHY = {
    'CEO': 4,
    'DIRECTOR': 3,
    'ADMIN': 3,
    'MANAGER': 2,
    'SALESMAN': 1,
    'CLERK': 0,       # Base employee level
    'DELIVERYMAN': 0,  # Base employee level
}

# Define role groups for common permission patterns
MANAGEMENT_ROLES = ['CEO', 'DIRECTOR', 'ADMIN']
SALES_ROLES = ['CEO', 'DIRECTOR', 'ADMIN', 'MANAGER', 'SALESMAN']
ALL_MANAGEMENT = ['CEO', 'DIRECTOR', 'ADMIN', 'MANAGER']


class RoleBasedPermission(permissions.BasePermission):
    """
    Base permission class for role-based access control.
    """
    required_roles: List[str] = []
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        try:
            user_role = request.user.profile.role
            return user_role in self.required_roles
        except:
            return False


class IsManagement(RoleBasedPermission):
    """Permission for management roles (CEO, Director, Admin)"""
    required_roles = MANAGEMENT_ROLES


class IsSalesTeam(RoleBasedPermission):
    """Permission for sales team and management"""
    required_roles = SALES_ROLES


class IsEmployeeOwnerOrManagement(permissions.BasePermission):
    """
    Permission that allows:
    - Users to access/modify their own data
    - Management to access/modify any data
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        try:
            # Check if user is accessing their own data
            if hasattr(obj, 'user') and obj.user == request.user:
                return True
            
            # Check if user is management
            user_role = request.user.profile.role
            return user_role in MANAGEMENT_ROLES
        except:
            return False


def check_role_permission(user_role: str, required_roles: List[str]) -> bool:
    """
    Check if a user role has permission based on required roles.
    
    Args:
        user_role: The user's current role
        required_roles: List of roles that have permission
        
    Returns:
        bool: True if user has permission, False otherwise
    """
    return user_role in required_roles


def check_role_hierarchy(user_role: str, minimum_role: str) -> bool:
    """
    Check if a user role meets or exceeds a minimum role level.
    
    Args:
        user_role: The user's current role
        minimum_role: The minimum required role
        
    Returns:
        bool: True if user role >= minimum role, False otherwise
    """
    user_level = ROLE_HIERARCHY.get(user_role, -1)
    min_level = ROLE_HIERARCHY.get(minimum_role, 999)
    return user_level >= min_level


def require_roles(allowed_roles: List[str], custom_message: Optional[str] = None):
    """
    Decorator for view methods that require specific roles.
    
    Args:
        allowed_roles: List of roles that are allowed
        custom_message: Optional custom error message
        
    Usage:
        @require_roles(['ADMIN', 'DIRECTOR', 'CEO'])
        def post(self, request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {"detail": PERMISSION_MESSAGES['not_authenticated']},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                user_role = request.user.profile.role
                if user_role not in allowed_roles:
                    message = custom_message or PERMISSION_MESSAGES['insufficient_role'].format(
                        roles=', '.join(allowed_roles)
                    )
                    return Response(
                        {"detail": message},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except:
                return Response(
                    {"detail": PERMISSION_MESSAGES['no_profile']},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator


# Centralized permission messages
PERMISSION_MESSAGES = {
    'not_authenticated': 'Authentication credentials were not provided.',
    'insufficient_role': 'You do not have permission to perform this action. Required roles: {roles}',
    'no_profile': 'User profile not found. Please contact an administrator.',
    'not_owner': 'You do not have permission to access this resource.',
    'inactive_account': 'This account has been deactivated. Please contact an administrator.',
    
    # Specific action messages
    'manage_employees': 'Only administrators, directors, and CEOs can manage employees.',
    'view_all_employees': 'Only administrators, directors, and CEOs can view all employees.',
    'toggle_employee_status': 'Only administrators, directors, and CEOs can change employee status.',
    'update_employee': 'You do not have permission to update this employee profile.',
    'view_payroll': 'Only administrators and directors can view payroll information.',
    'manage_sales': 'Only sales team members and management can access sales data.',
    'approve_vacation': 'Only managers and above can approve vacation requests.',
}


def get_permission_message(key: str, **kwargs) -> str:
    """
    Get a permission message by key with optional formatting.
    
    Args:
        key: The message key
        **kwargs: Optional format arguments
        
    Returns:
        str: The formatted message
    """
    message = PERMISSION_MESSAGES.get(key, 'Permission denied.')
    if kwargs:
        return message.format(**kwargs)
    return message