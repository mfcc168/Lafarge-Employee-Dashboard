from django.db import models
from employee.models import EmployeeProfile

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

    def get_total_days(self):
        total = 0
        for item in self.date_items.all():
            if item.type == 'half' and item.single_date:
                total += 0.5
            elif item.type == 'full' and item.from_date and item.to_date:
                delta = (item.to_date - item.from_date).days + 1
                total += max(delta, 0)
        return total


class VacationItem(models.Model):
    request = models.ForeignKey(VacationRequest, related_name="date_items", on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=[("full", "Full Day"), ("half", "Half Day")])
    HALF_DAY_PERIOD_CHOICES = [
        ('AM', 'Morning'),
        ('PM', 'Afternoon'),
    ]
    # For full-day vacation
    from_date = models.DateField(null=True, blank=True)
    to_date = models.DateField(null=True, blank=True)

    # For half-day vacation
    single_date = models.DateField(null=True, blank=True)
    half_day_period = models.CharField(max_length=2, choices=HALF_DAY_PERIOD_CHOICES, null=True, blank=True)
