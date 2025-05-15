from django.contrib import admin
from .models import EmployeeProfile

class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'base_salary']  # Display user and base_salary in the list view
    search_fields = ['user__username']  # Allow search by username of the user
    list_filter = ['base_salary']  # Add a filter for base_salary (optional)

admin.site.register(EmployeeProfile, EmployeeProfileAdmin)
