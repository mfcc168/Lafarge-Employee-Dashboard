from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChangePassword, ProtectedView, TokenObtainPairViewCustom, TokenRefreshViewCustom, VacationRequestCreateView, ReportEntryViewSet, GetSalaryView, GetAllEmployeeSalary, VacationRequestListView, VacationRequestUpdateAPIView, AllReportEntriesView

router = DefaultRouter()
router.register(r'report-entries', ReportEntryViewSet, basename='reportentry')

urlpatterns = [
    path('token/', TokenObtainPairViewCustom.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshViewCustom.as_view(), name='token_refresh'),
    path("protected-endpoint/", ProtectedView.as_view(), name="protected-endpoint"),
    path('get_salary/', GetSalaryView.as_view(), name='get_salary'),
    path('get_all_employee_salary/', GetAllEmployeeSalary.as_view(), name='get_all_employee_salary'),
    path('change-password/', ChangePassword.as_view(), name='change_password'),
    path('vacation/create', VacationRequestCreateView.as_view(), name='create-vacation'),
    path('vacations/', VacationRequestListView.as_view(), name='vacation-list'),
    path('vacation/<int:pk>/update/', VacationRequestUpdateAPIView.as_view(), name='vacation-update'),
    path('all-report-entries/', AllReportEntriesView.as_view(), name='all-report-entries'),
    path('', include(router.urls)),
]