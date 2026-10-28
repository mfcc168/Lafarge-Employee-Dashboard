from datetime import timedelta

from django.db.models import Q
from django.utils.cache import patch_cache_control
from django.utils.dateparse import parse_date
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.pagination import DailyReportPagination
from core.permissions import IsSalesTeam
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer


class FreshReportResponseMixin:
    """Report reads use indexed DB queries; React owns the short-lived cache.

    Do not add response caching or Redis invalidation to report writes. A slow
    cache must not delay an acknowledged save, and a GET must see committed edits.
    """
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        patch_cache_control(response, no_store=True)
        return response


def filter_salesman(queryset, name):
    if not name:
        return queryset
    return queryset.filter(
        Q(salesman__first_name__icontains=name) |
        Q(salesman__last_name__icontains=name) |
        Q(salesman__username=name)
    )


class ReportEntryViewSet(FreshReportResponseMixin, viewsets.ModelViewSet):
    queryset = ReportEntry.objects.select_related('salesman', 'salesman__profile').filter(salesman__profile__is_active=True).order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_id = serializer.validated_data.get('client_request_id')
        if request_id is None:
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED,
                            headers=self.get_success_headers(serializer.data))

        # The DB constraint also serializes simultaneous requests on different
        # workers. A retry returns the original row without replaying old data
        # over newer edits; the client can then PUT its latest draft to this ID.
        entry, created = ReportEntry.objects.get_or_create(
            salesman=request.user,
            client_request_id=request_id,
            defaults={key: value for key, value in serializer.validated_data.items()
                      if key != 'client_request_id'},
        )
        data = self.get_serializer(entry).data
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
                        headers=self.get_success_headers(data))
    
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

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        # Fetch only unique suggestion strings, not every report's text fields.
        # Keep older clients available instead of truncating the report history.
        entries = ReportEntry.objects.filter(salesman=request.user)
        fields = {'time_ranges': 'time_range', 'doctor_names': 'doctor_name', 'districts': 'district'}
        return Response({
            key: list(entries.exclude(**{field: ''}).order_by(field)
                      .values_list(field, flat=True).distinct())
            for key, field in fields.items()
        })


class AllReportEntriesView(FreshReportResponseMixin, generics.ListAPIView):
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
        return filter_salesman(qs, self.request.query_params.get("salesman_name"))

    def get(self, request, *args, **kwargs):
        if request.query_params.get('paginate') == 'true':
            self.pagination_class = DailyReportPagination
        return super().get(request, *args, **kwargs)


class ReportEntryDatesView(FreshReportResponseMixin, APIView):
    permission_classes = [IsSalesTeam]

    def get(self, request):
        # Only include dates from active employees
        dates = list(
            ReportEntry.objects.select_related('salesman__profile')
            .filter(salesman__profile__is_active=True)
            .values_list('date', flat=True)
            .distinct()
            .order_by('-date')
        )
        return Response(dates)


class ReportEntriesByDateView(FreshReportResponseMixin, generics.ListAPIView):
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
        return filter_salesman(qs, self.request.query_params.get("salesman_name"))
