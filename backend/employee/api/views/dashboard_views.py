"""
Dashboard views for general employee access to basic reporting data.
These endpoints provide limited access to reports for dashboard purposes.
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError

from report.models import ReportEntry
from report.serializers import ReportEntrySerializer


class DashboardReportEntriesView(generics.ListAPIView):
    """
    Dashboard view for report entries - accessible to all authenticated users.
    Provides basic reporting data for the home dashboard.
    Limited to basic information needed for dashboard charts.
    """
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only include report entries from active employees
        qs = ReportEntry.objects.select_related('salesman', 'salesman__profile').filter(
            salesman__profile__is_active=True
        ).order_by("-date")

        # Filter by single calendar date if provided
        date_param = self.request.query_params.get("date")
        if date_param:
            d = parse_date(date_param)
            if d:
                qs = qs.filter(date=d)

        return qs


@method_decorator(cache_page(settings.CACHE_TIMEOUTS.get('report_recent', 120)), name='get')
class DashboardReportEntriesByDateView(generics.ListAPIView):
    """
    Dashboard view for report entries by date range - accessible to all authenticated users.
    Provides basic reporting data for weekly/monthly dashboard summaries.
    """
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only include report entries from active employees
        qs = ReportEntry.objects.select_related('salesman', 'salesman__profile').filter(
            salesman__profile__is_active=True
        ).order_by("-date")

        # Get and validate date parameters
        start_date_param = self.request.query_params.get("start_date")
        end_date_param = self.request.query_params.get("end_date")
        
        if not start_date_param or not end_date_param:
            raise ValidationError("Both start_date and end_date parameters are required")
            
        start_date = parse_date(start_date_param)
        end_date = parse_date(end_date_param)
        
        if not start_date or not end_date:
            raise ValidationError("Invalid date format. Use YYYY-MM-DD")
            
        if start_date > end_date:
            raise ValidationError("start_date must be before or equal to end_date")

        # Limit date range to prevent abuse (max 90 days)
        if (end_date - start_date).days > 90:
            raise ValidationError("Date range cannot exceed 90 days")

        # Add one day to end_date to make it inclusive
        end_date_plus_one = end_date + timedelta(days=1)
        
        # Filter by date range
        qs = qs.filter(date__gte=start_date, date__lt=end_date_plus_one)

        return qs