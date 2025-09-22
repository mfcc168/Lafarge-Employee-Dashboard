from django.contrib import admin
from .models import EmployeeProfile

class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'base_salary', 'is_active']  # Display user, role, base_salary, and is_active
    search_fields = ['user__username', 'user__first_name', 'user__last_name']  # Allow search by username, first name, or last name
    list_filter = ['role', 'is_active']  # Add filters for role and active status

admin.site.register(EmployeeProfile, EmployeeProfileAdmin)
