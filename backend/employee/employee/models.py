from django.db import models
from django.contrib.auth.models import User

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
    is_active = models.BooleanField(default=True, help_text="Designates whether this employee should be treated as active.")

    def __str__(self):
        return f"{self.user.username}"
