from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, generics
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer
from django.db.models import DateField
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response


class ReportEntryViewSet(viewsets.ModelViewSet):
    queryset = ReportEntry.objects.all().order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ReportEntry.objects.filter(salesman=self.request.user)

    def perform_create(self, serializer):
        serializer.save(salesman=self.request.user)

# employee/api/views/report_views.py
from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer

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