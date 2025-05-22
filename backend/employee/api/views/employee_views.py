from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.views import APIView
from employee.models import EmployeeProfile
from employee.serializers import EmployeeProfileSerializer


class GetOwnSalaryView(APIView):
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

class GetOwnEmployeeProfile(generics.RetrieveAPIView):
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class GetEmployeeProfileAPIView(generics.RetrieveAPIView):
    queryset = EmployeeProfile.objects.all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]

class UpdateEmployeeProfileAPIView(generics.UpdateAPIView):
    queryset = EmployeeProfile.objects.all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        try:
            profile = self.get_object()
        except EmployeeProfile.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)