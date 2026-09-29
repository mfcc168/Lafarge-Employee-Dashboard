from rest_framework import serializers
from .models import ReportEntry

class ReportEntrySerializer(serializers.ModelSerializer):
    salesman_name = serializers.SerializerMethodField()
    client_request_id = serializers.UUIDField(required=False, allow_null=True)
    class Meta:
        model = ReportEntry
        fields = '__all__'
        read_only_fields = ['salesman', 'created_at', 'updated_at']
        # Repeated create keys must return the existing report, not a 400.
        # Uniqueness is enforced atomically by the database in get_or_create.
        validators = []

    def validate_client_request_id(self, value):
        if self.instance is not None and value != self.instance.client_request_id:
            raise serializers.ValidationError('The report request ID cannot be changed.')
        return value
        
    def get_salesman_name(self, obj):
        return obj.salesman.get_full_name() or obj.salesman.username
