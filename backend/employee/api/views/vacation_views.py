from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from vacation.models import VacationRequest
from vacation.serializers import VacationRequestSerializer
from rest_framework.exceptions import ValidationError
from core.redis_config import safe_cache_delete, safe_cache_get, safe_cache_set
from django.conf import settings
from core.permissions import require_roles, get_permission_message



class VacationRequestCreateView(generics.CreateAPIView):
    serializer_class = VacationRequestSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user_profile = self.request.user.profile
        instance = serializer.save(employee=user_profile)

        # Calculate total days from the instance
        total_days = instance.get_total_days()

        if total_days > user_profile.annual_leave_days:
            raise ValidationError(f"You only have {user_profile.annual_leave_days} days left, but requested {total_days}.")

        # Deduct days
        user_profile.annual_leave_days -= total_days
        user_profile.save()
        
        # Invalidate vacation-related caches
        safe_cache_delete('vacation_requests')
        safe_cache_delete(f'vacation_requests_user_{self.request.user.id}')

class VacationRequestListView(generics.ListAPIView):
    queryset = VacationRequest.objects.all()
    serializer_class = VacationRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        # Only management can view all vacation requests
        if request.user.profile.role not in ['MANAGER', 'ADMIN', 'DIRECTOR', 'CEO']:
            return Response(
                {"detail": get_permission_message('approve_vacation')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cache_key = 'vacation_requests'
        cached_data = safe_cache_get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        safe_cache_set(cache_key, response.data, settings.CACHE_TIMEOUTS['vacation_requests'])
        return response
    
class VacationRequestUpdateAPIView(generics.UpdateAPIView):
    queryset = VacationRequest.objects.all()
    serializer_class = VacationRequestSerializer
    permission_classes = [IsAuthenticated]

    @require_roles(['MANAGER', 'ADMIN', 'DIRECTOR', 'CEO'], custom_message=get_permission_message('approve_vacation'))
    def update(self, request, *args, **kwargs):
        vacation_request = self.get_object()
        new_status = request.data.get('status')

        if new_status not in ['approved', 'rejected']:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_status == "rejected" and vacation_request.status != "rejected":
            user_profile = vacation_request.employee
            total_days = vacation_request.get_total_days()
            user_profile.annual_leave_days += total_days
            user_profile.save()

        vacation_request.status = new_status
        vacation_request.save()
        
        # Invalidate vacation-related caches
        safe_cache_delete('vacation_requests')
        safe_cache_delete(f'vacation_requests_user_{vacation_request.employee.user.id}')

        return Response(self.get_serializer(vacation_request).data, status=status.HTTP_200_OK)
    
class MyVacationRequestListView(generics.ListAPIView):
    serializer_class = VacationRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user.profile
        return VacationRequest.objects.filter(employee=user_profile)

    def list(self, request, *args, **kwargs):
        cache_key = f'vacation_requests_user_{request.user.id}'
        cached_data = safe_cache_get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        safe_cache_set(cache_key, response.data, settings.CACHE_TIMEOUTS['vacation_requests'])
        return response
