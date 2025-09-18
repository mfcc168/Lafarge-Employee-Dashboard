from api.pdf import draw_payslip_page
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.views import APIView
from django.http import HttpResponse
from employee.models import EmployeeProfile
from employee.serializers import EmployeeProfileSerializer
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from core.redis_config import safe_cache_delete
from rest_framework.decorators import action
import io


@method_decorator(cache_page(settings.CACHE_TIMEOUTS['user_salary']), name='get')
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
        

@method_decorator(cache_page(settings.CACHE_TIMEOUTS['employee_salaries']), name='get')
class GetAllEmployeeSalary(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profiles = EmployeeProfile.objects.select_related('user').filter(is_active=True)
        serializer = EmployeeProfileSerializer(profiles, many=True)
        return Response(serializer.data)

class GetOwnEmployeeProfile(generics.RetrieveAPIView):
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class GetEmployeeProfileAPIView(generics.RetrieveAPIView):
    queryset = EmployeeProfile.objects.select_related('user').all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]

class UpdateEmployeeProfileAPIView(generics.UpdateAPIView):
    queryset = EmployeeProfile.objects.select_related('user').all()
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
        
        # Invalidate related caches after profile update
        safe_cache_delete(f'user_profile_{profile.user.id}')
        safe_cache_delete(f'user_salary_{profile.user.id}')
        safe_cache_delete('employee_salaries')
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class DownloadPaySlipPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        employees_data = request.data.get("profiles", [])
        commissions_data = request.data.get("commissions", {})  # username -> commission
        year = request.data.get("year")
        month = request.data.get("month")

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)

        for employee_data in employees_data:
            username = employee_data.get("user", {}).get("username")
            commission = float(commissions_data.get(username, 0))
            draw_payslip_page(pdf, employee_data, commission, year, month)
            pdf.showPage()

        pdf.save()
        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()

        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="Payslip.pdf"'
        return response


class ToggleEmployeeStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        # Check if user has admin or director role
        if request.user.profile.role not in ['ADMIN', 'DIRECTOR']:
            return Response(
                {"detail": "Only administrators and directors can toggle employee status."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = EmployeeProfile.objects.get(pk=pk)
        except EmployeeProfile.DoesNotExist:
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Toggle the is_active status
        profile.is_active = not profile.is_active
        profile.save()
        
        # Invalidate related caches
        safe_cache_delete(f'user_profile_{profile.user.id}')
        safe_cache_delete(f'user_salary_{profile.user.id}')
        safe_cache_delete('employee_salaries')
        
        action = "activated" if profile.is_active else "deactivated"
        
        return Response({
            "detail": f"Employee {profile.user.username} has been {action}.",
            "is_active": profile.is_active
        })


class GetAllEmployeesView(APIView):
    """Get all employees including their active status - for admin view"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if user has admin or director role
        if request.user.profile.role not in ['ADMIN', 'DIRECTOR']:
            return Response(
                {"detail": "Only administrators and directors can view all employees."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get ALL employees, including inactive ones
        profiles = EmployeeProfile.objects.select_related('user').all()
        serializer = EmployeeProfileSerializer(profiles, many=True)
        return Response(serializer.data)
