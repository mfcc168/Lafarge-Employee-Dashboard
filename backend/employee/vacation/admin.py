from django.contrib import admin
from .models import VacationRequest, VacationItem
# Register your models here.

class VacationItemInline(admin.TabularInline):
    model = VacationItem
    extra = 0

class VacationRequestAdmin(admin.ModelAdmin):
    inlines = [VacationItemInline]
    list_display = ('employee', 'submitted_at', 'status')
admin.site.register(VacationRequest, VacationRequestAdmin)
