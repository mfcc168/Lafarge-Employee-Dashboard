from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, generics
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer
from django.db.models import DateField
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError
from datetime import timedelta
from api.pagination import OptimizedPageNumberPagination, DailyReportPagination
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from datetime import datetime, timedelta
from django.conf import settings
from core.redis_config import safe_cache_get, safe_cache_set, safe_cache_delete

def get_cache_timeout_for_date(date_param):
    """
    Determine cache timeout based on how old the data is:
    - Current date: No cache (0 seconds)
    - 1-7 days old: 2 minutes
    - 8+ days old: 60 minutes
    """
    if not date_param:
        return settings.CACHE_TIMEOUTS['report_recent']
    
    try:
        query_date = parse_date(date_param)
        if not query_date:
            return settings.CACHE_TIMEOUTS['report_recent']
        
        today = datetime.now().date()
        days_old = (today - query_date).days
        
        if days_old == 0:
            return settings.CACHE_TIMEOUTS['report_current_date']  # No cache
        elif days_old <= 7:
            return settings.CACHE_TIMEOUTS['report_recent']  # 2 minutes
        else:
            return settings.CACHE_TIMEOUTS['report_historical']  # 60 minutes
    except:
        return settings.CACHE_TIMEOUTS['report_recent']

from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.utils.dateparse import parse_date
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
        serializer.save(salesman=self.request.user)
        # Invalidate report caches when new entry is created
        safe_cache_delete('report_entry_dates')
        # Clear date-specific caches for today
        today = datetime.now().date().strftime('%Y-%m-%d')
        safe_cache_delete(f'report_entries_date:{today}:salesman:all')
        safe_cache_delete(f'report_entries_date:{today}:salesman:{self.request.user.username}')


class AllReportEntriesView(generics.ListAPIView):
    """
    GET /api/all-report-entries/?date=YYYY-MM-DD[&salesman=<id|full name>]
    Returns **all** entries for that calendar date (one day, midnight‑to‑midnight).
    
    Optional pagination: Add ?paginate=true to enable pagination
    """
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]
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
        """Override to conditionally apply pagination and variable caching"""
        date_param = request.query_params.get("date")
        cache_timeout = get_cache_timeout_for_date(date_param)
        
        # Only cache if timeout > 0
        if cache_timeout > 0:
            cache_key = f"report_entries_date:{date_param}:salesman:{request.query_params.get('salesman_name', 'all')}"
            cached_response = safe_cache_get(cache_key)
            
            if cached_response is not None:
                return Response(cached_response)
            
            # Get the response and cache it
            response = super().get(request, *args, **kwargs)
            if response.status_code == 200:
                safe_cache_set(cache_key, response.data, cache_timeout)
            return response
        
        # No caching for current date
        if request.query_params.get('paginate') == 'true':
            self.pagination_class = DailyReportPagination()
        return super().get(request, *args, **kwargs)

    
@method_decorator(cache_page(60 * 15), name='get')  # Cache for 15 minutes
class ReportEntryDatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only include dates from active employees
        dates = list(
            ReportEntry.objects.select_related('salesman__profile')
            .filter(salesman__profile__is_active=True)
            .annotate(date_only=TruncDate('date'))
            .values_list('date_only', flat=True)
            .distinct()
            .order_by('-date_only')
        )
        return Response(dates)


class ReportEntriesByDateView(generics.ListAPIView):
    """
    GET /api/report-entries-by-date/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD[&salesman_name=<name>]
    Returns all entries within the specified date range (inclusive).
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

        # Add one day to end_date to make it inclusive
        end_date_plus_one = end_date + timedelta(days=1)
        
        # Filter by date range
        qs = qs.filter(date__gte=start_date, date__lt=end_date_plus_one)

        # Optional salesman filter
        salesman_param = self.request.query_params.get("salesman_name")
        if salesman_param:
            qs = qs.filter(salesman_name=salesman_param)

        return qs
    
    def get(self, request, *args, **kwargs):
        """Apply variable caching based on date range"""
        start_date_param = request.query_params.get("start_date")
        end_date_param = request.query_params.get("end_date")
        
        # Use the most recent date to determine cache timeout
        cache_timeout = max(
            get_cache_timeout_for_date(start_date_param),
            get_cache_timeout_for_date(end_date_param)
        )
        
        # Only cache if timeout > 0
        if cache_timeout > 0:
            salesman_param = request.query_params.get("salesman_name", "all")
            cache_key = f"report_entries_range:{start_date_param}:{end_date_param}:salesman:{salesman_param}"
            cached_response = safe_cache_get(cache_key)
            
            if cached_response is not None:
                return Response(cached_response)
            
            # Get the response and cache it
            response = super().get(request, *args, **kwargs)
            if response.status_code == 200:
                safe_cache_set(cache_key, response.data, cache_timeout)
            return response
        
        # No caching for current date ranges
        return super().get(request, *args, **kwargs)