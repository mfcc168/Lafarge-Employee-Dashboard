from django.db import models
from django.contrib.auth.models import User 

class ReportEntry(models.Model):
    CLIENT_TYPE_CHOICES = [
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
    ]

    salesman = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_entries')
    date = models.DateField()

    time_range = models.CharField(max_length=100)
    
    doctor_name = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    client_type = models.CharField(max_length=10, choices=CLIENT_TYPE_CHOICES)
    new_client = models.BooleanField(default=False)

    orders = models.TextField(blank=True)
    tel_orders = models.TextField(blank=True)
    samples = models.TextField(blank=True)

    new_product_intro = models.TextField(blank=True)
    old_product_followup = models.TextField(blank=True)
    delivery_time_update = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report Entry for {self.doctor_name} on {self.date}"
