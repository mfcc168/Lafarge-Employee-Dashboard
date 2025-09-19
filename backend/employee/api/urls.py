from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.auth_views import TokenObtainPairViewCustom, TokenRefreshViewCustom, ProtectedView, ChangePassword
from .views.employee_views import DownloadPaySlipPDFView, GetOwnSalaryView, GetAllEmployeeSalary, GetOwnEmployeeProfile, GetEmployeeProfileAPIView, UpdateEmployeeProfileAPIView, ToggleEmployeeStatusView, GetAllEmployeesView
from .views.vacation_views import MyVacationRequestListView, VacationRequestCreateView, VacationRequestListView, VacationRequestUpdateAPIView
from .views.report_views import ReportEntryDatesView, ReportEntryViewSet, AllReportEntriesView, ReportEntriesByDateView
from .views.dashboard_views import DashboardReportEntriesView, DashboardReportEntriesByDateView
from .views.health import redis_health, app_health, redis_metrics, cache_warm, cache_stats

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
    
    path('profile/<int:pk>/', GetEmployeeProfileAPIView.as_view(), name='get-employee-profile'),
    path('profile/<int:pk>/update/', UpdateEmployeeProfileAPIView.as_view(), name='update-employee-profile'),
    path('profile/<int:pk>/toggle-status/', ToggleEmployeeStatusView.as_view(), name='toggle-employee-status'),
    path('employees/all/', GetAllEmployeesView.as_view(), name='get-all-employees'),

    path('vacation/create', VacationRequestCreateView.as_view(), name='create-vacation'),
    path('vacations/', VacationRequestListView.as_view(), name='vacation-list'),
    path('vacation/<int:pk>/update/', VacationRequestUpdateAPIView.as_view(), name='vacation-update'),
    path('vacations/me/', MyVacationRequestListView.as_view(), name='get-own-vacation-list'),

    # Report management endpoints (sales team only)
    path('all-report-entries/', AllReportEntriesView.as_view(), name='all-report-entries'),
    path("report-entry-dates/", ReportEntryDatesView.as_view()),
    path('report-entries-by-date/', ReportEntriesByDateView.as_view(), name='report-entries-by-date'),
    
    # Dashboard endpoints (all authenticated users)
    path('dashboard/report-entries/', DashboardReportEntriesView.as_view(), name='dashboard-report-entries'),
    path('dashboard/report-entries-by-date/', DashboardReportEntriesByDateView.as_view(), name='dashboard-report-entries-by-date'),
    
    # Health check endpoints
    path('health/redis/', redis_health, name='redis-health'),
    path('health/', app_health, name='app-health'),
    
    # Cache monitoring and management endpoints
    path('health/redis/metrics/', redis_metrics, name='redis-metrics'),
    path('health/cache/stats/', cache_stats, name='cache-stats'),
    path('health/cache/warm/', cache_warm, name='cache-warm'),
    
    path('', include(router.urls)),
]