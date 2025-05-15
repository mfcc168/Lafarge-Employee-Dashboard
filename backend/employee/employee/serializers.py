from rest_framework import serializers
from .models import EmployeeProfile
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]

class EmployeeProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = EmployeeProfile
        fields = '__all__'
