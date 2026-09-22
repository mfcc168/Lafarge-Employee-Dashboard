from rest_framework import serializers
import base64
import binascii
import re

from .models import VacationRequest, VacationItem
from django.contrib.auth import get_user_model

User = get_user_model()

class VacationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacationItem
        fields = [
            'type',
            'from_date',
            'to_date',
            'single_date',
            'half_day_period',
            'leave_type'
        ]


class VacationRequestSerializer(serializers.ModelSerializer):
    date_items = VacationItemSerializer(many=True)
    employee = serializers.CharField(source='employee.user.username', read_only=True)
    signature_data = serializers.CharField()

    class Meta:
        model = VacationRequest
        fields = ['id', 'employee', 'submitted_at', 'status', 'signature_data', 'date_items']
        read_only_fields = ['submitted_at', 'status', 'employee']

    def create(self, validated_data):
        date_items_data = validated_data.pop('date_items')
        request_obj = VacationRequest.objects.create(**validated_data)

        for item_data in date_items_data:
            VacationItem.objects.create(request=request_obj, **item_data)

        return request_obj

    def validate_signature_data(self, value: str) -> str:
        """
        Validate the signature data to ensure it is a base64-encoded PNG or JPEG image.
        """
        if not value:
            raise serializers.ValidationError("Signature is required.")

        if not value.startswith('data:image/'):
            raise serializers.ValidationError("Signature must be a valid data URL image.")

        try:
            header, encoded = value.split(',', 1)
        except ValueError as exc:
            raise serializers.ValidationError("Invalid signature data format.") from exc

        mime_match = re.match(r"data:image/(png|jpeg);base64", header)
        if not mime_match:
            raise serializers.ValidationError("Signature must be a PNG or JPEG image.")

        # Approximate limit to ~1MB encoded images
        if len(encoded) > 1_400_000:
            raise serializers.ValidationError("Signature image is too large. Please use a smaller signature.")

        try:
            base64.b64decode(encoded)
        except (binascii.Error, ValueError) as exc:
            raise serializers.ValidationError("Signature data is not valid base64.") from exc

        return value
