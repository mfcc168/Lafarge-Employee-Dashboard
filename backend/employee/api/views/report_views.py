from datetime import timedelta

from django.db.models.functions import TruncDate
from django.utils.dateparse import parse_date
from rest_framework import generics, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.pagination import DailyReportPagination
from core.permissions import IsSalesTeam
from core.redis_config import safe_cache_get, safe_cache_set
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer


class ReportEntryViewSet(viewsets.ModelViewSet):
    queryset = ReportEntry.objects.select_related('salesman', 'salesman__profile').filter(salesman__profile__is_active=True).order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ReportEntry.objects.select_related('salesman').filter(salesman=self.request.user)
        
        # Add date filtering if date parameter is provided
        date_param = self.request.query_params.get('date')
        if date_param:
            date = parse_date(date_param)
            if date:
                queryset = queryset.filter(date=date)
        
        return queryset.order_by('-date')

    def perform_create(self, serializer):
        # Cache invalidation is centralized in report.signals so create/update/
        # delete all follow the same rules.
        serializer.save(salesman=self.request.user)


class ReportEntrySuggestionsView(APIView):
    """Small autocomplete payload for the report editor.

    The old frontend downloaded the user's complete report history just to
    build a few autocomplete lists. Limit the scan and return only distinct
    strings so opening the editor stays fast as report history grows.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent_values = (
            ReportEntry.objects
            .filter(salesman=request.user)
            .order_by('-date', '-created_at')
            .values_list('time_range', 'doctor_name', 'district')[:1000]
        )

        time_ranges = set()
        doctor_names = set()
        districts = set()

        for time_range, doctor_name, district in recent_values:
            if time_range:
                time_ranges.add(time_range)
            if doctor_name:
                doctor_names.add(doctor_name)
            if district:
                districts.add(district)

        return Response({
            'time_ranges': sorted(time_ranges),
            'doctor_names': sorted(doctor_names),
            'districts': sorted(districts),
        })


class AllReportEntriesView(generics.ListAPIView):
    """
    GET /api/all-report-entries/?date=YYYY-MM-DD[&salesman=<id|full name>]
    Returns **all** entries for that calendar date (one day, midnight‑to‑midnight).
    
    Optional pagination: Add ?paginate=true to enable pagination
    """
    serializer_class = ReportEntrySerializer
    permission_classes = [IsSalesTeam]
    pagination_class = None  # No pagination by default for backwards compatibility

    def get_queryset(self):
        # Only include report entries from active employees
        qs = ReportEntry.objects.select_related('salesman', 'salesman__profile').filter(
            salesman__profile__is_active=True
        ).order_by("-date")

        # filter by single calendar date
        date_param = self.request.query_params.get("date")
        if date_param:
            d = parse_date(date_param)
            if d:
                qs = qs.filter(date=d)

        # optional: also allow ?salesman=<full name>
        salesman_param = self.request.query_params.get("salesman_name")
        if salesman_param:
            # Filter by salesman's full name through the User model
            from django.db.models import Q
            qs = qs.filter(
                Q(salesman__first_name__icontains=salesman_param) |
                Q(salesman__last_name__icontains=salesman_param) |
                Q(salesman__username=salesman_param)
            )

        return qs
    
    def get(self, request, *args, **kwargs):
        # Report CRUD is already backed by indexed PostgreSQL queries. Avoid
        # Redis here so writes do not need expensive cache-pattern cleanup.
        if request.query_params.get('paginate') == 'true':
            self.pagination_class = DailyReportPagination()
        return super().get(request, *args, **kwargs)

    
class ReportEntryDatesView(APIView):
    permission_classes = [IsSalesTeam]

    def get(self, request):
        # Use an explicit key so report.signals can reliably invalidate it.
        cache_key = 'report_entry_dates'
        cached_dates = safe_cache_get(cache_key)
        if cached_dates is not None:
            return Response(cached_dates)

        # Only include dates from active employees
        dates = list(
            ReportEntry.objects.select_related('salesman__profile')
            .filter(salesman__profile__is_active=True)
            .annotate(date_only=TruncDate('date'))
            .values_list('date_only', flat=True)
            .distinct()
            .order_by('-date_only')
        )
        safe_cache_set(cache_key, dates, 60 * 15)
        return Response(dates)


class ReportEntriesByDateView(generics.ListAPIView):
    """
    GET /api/report-entries-by-date/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD[&salesman_name=<name>]
    Returns all entries within the specified date range (inclusive).
    """
    serializer_class = ReportEntrySerializer
    permission_classes = [IsSalesTeam]

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

        # Add one day to end_date to make it inclusive
        end_date_plus_one = end_date + timedelta(days=1)
        
        # Filter by date range
        qs = qs.filter(date__gte=start_date, date__lt=end_date_plus_one)

        # Optional salesman filter
        salesman_param = self.request.query_params.get("salesman_name")
        if salesman_param:
            from django.db.models import Q
            qs = qs.filter(
                Q(salesman__first_name__icontains=salesman_param) |
                Q(salesman__last_name__icontains=salesman_param) |
                Q(salesman__username=salesman_param)
            )

        return qs
    
    def get(self, request, *args, **kwargs):
        # Keep range reads simple and always fresh. For this internal app the
        # indexed PostgreSQL query is cheaper than synchronizing Redis on every
        # report edit.
        return super().get(request, *args, **kwargs)
