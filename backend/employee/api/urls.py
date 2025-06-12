from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.auth_views import TokenObtainPairViewCustom, TokenRefreshViewCustom, ProtectedView, ChangePassword
from .views.employee_views import DownloadPaySlipPDFView, GetOwnSalaryView, GetAllEmployeeSalary, GetOwnEmployeeProfile, GetEmployeeProfileAPIView, UpdateEmployeeProfileAPIView
from .views.vacation_views import MyVacationRequestListView, VacationRequestCreateView, VacationRequestListView, VacationRequestUpdateAPIView
from .views.report_views import ReportEntryViewSet, AllReportEntriesView

router = DefaultRouter()
router.register(r'report-entries', ReportEntryViewSet, basename='reportentry')

urlpatterns = [
    path('token/', TokenObtainPairViewCustom.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshViewCustom.as_view(), name='token_refresh'),
    path("protected-endpoint/", ProtectedView.as_view(), name="protected-endpoint"),
    path('change-password/', ChangePassword.as_view(), name='change-password'),

    path('salary/me', GetOwnSalaryView.as_view(), name='get-own-salary'),
    path('salaries/', GetAllEmployeeSalary.as_view(), name='get-all-employee-salary'),

    path('payroll/pdf/', DownloadPaySlipPDFView.as_view(), name='payslip-pdf'),
    
    path('profile/<int:pk>/update/', UpdateEmployeeProfileAPIView.as_view(), name='update-employee-profile'),

    path('vacation/create', VacationRequestCreateView.as_view(), name='create-vacation'),
    path('vacations/', VacationRequestListView.as_view(), name='vacation-list'),
    path('vacation/<int:pk>/update/', VacationRequestUpdateAPIView.as_view(), name='vacation-update'),
    path('vacations/me/', MyVacationRequestListView.as_view(), name='get-own-vacation-list'),

    path('all-report-entries/', AllReportEntriesView.as_view(), name='all-report-entries'),
    path('', include(router.urls)),
]