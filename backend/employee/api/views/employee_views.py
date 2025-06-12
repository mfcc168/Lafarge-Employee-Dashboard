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
import io


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
