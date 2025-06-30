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

from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.utils.dateparse import parse_date
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer

class ReportEntryViewSet(viewsets.ModelViewSet):
    queryset = ReportEntry.objects.all().order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ReportEntry.objects.filter(salesman=self.request.user)
        
        # Add date filtering if date parameter is provided
        date_param = self.request.query_params.get('date')
        if date_param:
            date = parse_date(date_param)
            if date:
                queryset = queryset.filter(date=date)
        
        return queryset.order_by('-date')

    def perform_create(self, serializer):
        serializer.save(salesman=self.request.user)


class AllReportEntriesView(generics.ListAPIView):
    """
    GET /api/all-report-entries/?date=YYYY-MM-DD[&salesman=<id|full name>]
    Returns **all** entries for that calendar date (one day, midnight‑to‑midnight).
    """
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ReportEntry.objects.all().order_by("-date")

        # filter by single calendar date
        date_param = self.request.query_params.get("date")
        if date_param:
            d = parse_date(date_param)
            if d:
                qs = qs.filter(date=d)

        # optional: also allow ?salesman=<full name>
        salesman_param = self.request.query_params.get("salesman_name")
        if salesman_param:
            qs = qs.filter(salesman_name=salesman_param)

        return qs

    
class ReportEntryDatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dates = (
            ReportEntry.objects.annotate(date_only=TruncDate('date'))
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
        qs = ReportEntry.objects.all().order_by("-date")

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