from django.db import models
from employee.models import EmployeeProfile
from .business_days import BusinessDaysCalculator

class VacationRequest(models.Model):
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("approved", "Approved"),
            ("rejected", "Rejected")
        ],
        default="pending"
    )
    signature_data = models.TextField(
        blank=True,
        help_text="Base64 encoded representation of the employee's handwritten signature."
    )

    def get_total_days(self):
        total = 0
        for item in self.date_items.all():
            if item.leave_type == 'Sick Leave':
                continue
            if item.type == 'half' and item.single_date:
                # For half days, check if it's a business day
                business_days = BusinessDaysCalculator.calculate_business_days(
                    item.single_date, item.single_date
                )
                total += 0.5 if business_days > 0 else 0
            elif item.type == 'full' and item.from_date and item.to_date:
                business_days = BusinessDaysCalculator.calculate_business_days(
                    item.from_date, item.to_date
                )
                total += business_days
        return total


class VacationItem(models.Model):
    request = models.ForeignKey(VacationRequest, related_name="date_items", on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=[("full", "Full Day"), ("half", "Half Day")])
    HALF_DAY_PERIOD_CHOICES = [
        ('AM', 'Morning'),
        ('PM', 'Afternoon'),
    ]
    LEAVE_CHOICES = [
        ('Annual Leave', 'Annual Leave'),
        ('Sick Leave', 'Sick Leave'),
    ]
    # For full-day vacation
    from_date = models.DateField(null=True, blank=True)
    to_date = models.DateField(null=True, blank=True)

    # For half-day vacation
    single_date = models.DateField(null=True, blank=True)
    half_day_period = models.CharField(max_length=2, choices=HALF_DAY_PERIOD_CHOICES, null=True, blank=True)
    leave_type = models.CharField(max_length=20, choices=LEAVE_CHOICES, null=True, blank=True, default='Annual Leave',)
