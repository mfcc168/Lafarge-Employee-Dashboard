from rest_framework import serializers
from .models import VacationRequest, VacationItem
from django.contrib.auth import get_user_model

User = get_user_model()

class VacationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacationItem
        fields = ['type', 'from_date', 'to_date', 'single_date']

class VacationRequestSerializer(serializers.ModelSerializer):
    date_items = VacationItemSerializer(many=True)
    employee = serializers.CharField(source='employee.user.username', read_only=True)
    class Meta:
        model = VacationRequest
        fields = ['id', 'employee', 'submitted_at', 'status', 'date_items']
        read_only_fields = ['submitted_at', 'status', 'employee']

    def create(self, validated_data):
        date_items_data = validated_data.pop('date_items')

        request_obj = VacationRequest.objects.create(**validated_data)

        for item in date_items_data:
            VacationItem.objects.create(request=request_obj, **item)

        return request_obj
