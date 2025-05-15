from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from report.models import ReportEntry
from report.serializers import ReportEntrySerializer
from employee.models import EmployeeProfile
from employee.serializers import EmployeeProfileSerializer
from vacation.models import VacationItem, VacationRequest
from vacation.serializers import VacationItemSerializer, VacationRequestSerializer
from rest_framework.exceptions import ValidationError

class TokenObtainPairViewCustom(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # Call the parent post method to obtain token pair
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = response.data
            return Response(data)
        return response


class TokenRefreshViewCustom(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Get the refresh token from request body
        refresh_token = request.data.get('refresh', None)
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Perform refresh operation
        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = response.data
            # Return the new access token
            return Response(data)
        return response

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username,
            "email": request.user.email,
            "role": request.user.profile.role,
            "annual_leave_days": request.user.profile.annual_leave_days,
        })


class ReportEntryViewSet(viewsets.ModelViewSet):
    queryset = ReportEntry.objects.all().order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ReportEntry.objects.filter(salesman=self.request.user)

    def perform_create(self, serializer):
        serializer.save(salesman=self.request.user)


class GetSalaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            profile = EmployeeProfile.objects.get(user=request.user)
            return Response({'base_salary': profile.base_salary,
                             'bonus_payment': profile.bonus_payment,
                             "transportation_allowance": profile.transportation_allowance,
                             "is_mpf_exempt": profile.is_mpf_exempt
                             })
        except EmployeeProfile.DoesNotExist:
            return Response({'error': 'Profile not found for this user'}, status=status.HTTP_404_NOT_FOUND)
        

class GetAllEmployeeSalary(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profiles = EmployeeProfile.objects.select_related('user').all()
        serializer = EmployeeProfileSerializer(profiles, many=True)
        return Response(serializer.data)


class ChangePassword(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not user.check_password(current_password):
            return Response({"detail": "Current password is incorrect"}, status=400)

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response({"detail": list(e.messages)}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password changed successfully"})
    
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
    
class AllReportEntriesView(generics.ListAPIView):
    queryset = ReportEntry.objects.all().order_by('-date')
    serializer_class = ReportEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReportEntry.objects.all().order_by('-date')