from rest_framework import serializers
from .models import ReportEntry

class ReportEntrySerializer(serializers.ModelSerializer):
    salesman_name = serializers.SerializerMethodField()
    class Meta:
        model = ReportEntry
        fields = '__all__'
        read_only_fields = ['salesman', 'created_at', 'updated_at']
        
    def get_salesman_name(self, obj):
        return obj.salesman.get_full_name() or obj.salesman.username
