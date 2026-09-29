from datetime import timedelta

from django.db.models import Count, Max, Q
from django.db.models.functions import TruncDate
from django.utils.dateparse import parse_date
from rest_framework import generics, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.pagination import DailyReportPagination
from core.permissions import IsSalesTeam
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
        # This query is small and indexed. Keeping it uncached prevents Redis
        # health from affecting report create/update/delete latency.
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


class ClientDirectoryView(APIView):
    """Return a compact aggregated client directory instead of full report history."""

    permission_classes = [IsSalesTeam]

    def get(self, request):
        queryset = (
            ReportEntry.objects
            .select_related('salesman', 'salesman__profile')
            .filter(salesman__profile__is_active=True)
            .exclude(doctor_name='')
        )

        if request.user.profile.role == 'SALESMAN':
            queryset = queryset.filter(salesman=request.user)

        search = request.query_params.get('q', '').strip()
        if search:
            queryset = queryset.filter(
                Q(doctor_name__icontains=search) |
                Q(district__icontains=search)
            )

        rows = (
            queryset
            .values(
                'doctor_name',
                'district',
                'client_type',
                'salesman__first_name',
                'salesman__last_name',
                'salesman__username',
            )
            .annotate(
                visits=Count('id'),
                last_visit=Max('date'),
            )
            .order_by('-last_visit', 'doctor_name')[:250]
        )

        results = []
        for row in rows:
            full_name = (
                f"{row['salesman__first_name']} {row['salesman__last_name']}"
            ).strip()
            results.append({
                'doctor_name': row['doctor_name'],
                'district': row['district'],
                'client_type': row['client_type'],
                'salesman_name': full_name or row['salesman__username'],
                'visits': row['visits'],
                'last_visit': (
                    row['last_visit'].isoformat()
                    if row['last_visit']
                    else ''
                ),
            })

        return Response(results)
