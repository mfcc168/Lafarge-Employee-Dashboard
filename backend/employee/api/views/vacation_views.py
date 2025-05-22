from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from vacation.models import VacationRequest
from vacation.serializers import VacationRequestSerializer
from rest_framework.exceptions import ValidationError



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

class VacationRequestListView(generics.ListAPIView):
    queryset = VacationRequest.objects.all()
    serializer_class = VacationRequestSerializer
    permission_classes = [IsAuthenticated]
    
class VacationRequestUpdateAPIView(generics.UpdateAPIView):
    queryset = VacationRequest.objects.all()
    serializer_class = VacationRequestSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        vacation_request = self.get_object()
        new_status = request.data.get('status')

        if new_status not in ['approved', 'rejected']:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        vacation_request.status = new_status
        vacation_request.save()

        return Response(self.get_serializer(vacation_request).data, status=status.HTTP_200_OK)