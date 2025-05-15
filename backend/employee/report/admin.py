from django.contrib import admin
from .models import ReportEntry
# Register your models here.

class ReportEntryAdmin(admin.ModelAdmin):
    pass
admin.site.register(ReportEntry, ReportEntryAdmin)