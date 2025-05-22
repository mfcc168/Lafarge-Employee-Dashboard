from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, generics
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer


class ReportEntryViewSet(viewsets.ModelViewSet):
    queryset = ReportEntry.objects.all().order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ReportEntry.objects.filter(salesman=self.request.user)

    def perform_create(self, serializer):
        serializer.save(salesman=self.request.user)

class AllReportEntriesView(generics.ListAPIView):
    queryset = ReportEntry.objects.all().order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReportEntry.objects.all().order_by('-date')