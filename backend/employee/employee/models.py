from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class EmployeeProfile(models.Model):

    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Manager'),
        ('SALESMAN', 'Salesman'),
        ('CLERK', 'Clerk'),
        ('DELIVERYMAN', 'Deliveryman'),
        ('DIRECTOR', 'Director'),
        ('CEO', 'CEO'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DELIVERYMAN')
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    transportation_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    is_mpf_exempt = models.BooleanField(default=False)
    annual_leave_days = models.FloatField(default=7.0)
    bonus_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    year_end_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    employment_date = models.DateField(null=True, blank=True, help_text="Employee employment start date used for annual leave calculations.")
    is_active = models.BooleanField(default=True, help_text="Designates whether this employee should be treated as active.")

    def __str__(self):
        return f"{self.user.username}"

    def get_service_year(self, as_of_date=None):
        """
        Return the 1-based service year number for the employee as of the provided date.
        """
        if not self.employment_date:
            return None

        as_of = as_of_date or timezone.now().date()
        employment_date = self.employment_date

        years_difference = as_of.year - employment_date.year

        # If the anniversary for the current year hasn't happened yet, subtract one.
        anniversary_passed = (as_of.month, as_of.day) >= (employment_date.month, employment_date.day)
        years_completed = years_difference if anniversary_passed else years_difference - 1

        # Service year is completed years + 1, but never less than 1.
        return max(1, years_completed + 1)

    def calculate_annual_leave_entitlement(self, as_of_date=None):
        """
        Determine annual leave entitlement based on service year progression.
        """
        service_year = self.get_service_year(as_of_date=as_of_date)

        if service_year is None or service_year <= 2:
            return 7.0

        entitlement_map = {
            3: 8.0,
            4: 9.0,
            5: 10.0,
            6: 11.0,
            7: 12.0,
            8: 13.0,
        }

        return entitlement_map.get(service_year, 14.0)

    def reset_annual_leave_days(self, as_of_date=None, save=True):
        """
        Reset annual leave days to the current entitlement. Optionally persist the change.
        """
        entitlement = self.calculate_annual_leave_entitlement(as_of_date=as_of_date)
        self.annual_leave_days = entitlement
        if save:
            self.save(update_fields=['annual_leave_days'])
        return entitlement
