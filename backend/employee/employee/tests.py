from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase

from employee.models import EmployeeProfile


class EmployeeProfileAnnualLeaveTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="leave-tester")
        self.employment_start = date(2020, 1, 1)
        self.profile = EmployeeProfile.objects.create(
            user=self.user,
            employment_date=self.employment_start,
            annual_leave_days=0.0,
        )

    def test_service_year_calculation(self):
        self.assertEqual(self.profile.get_service_year(as_of_date=date(2020, 1, 1)), 1)
        self.assertEqual(self.profile.get_service_year(as_of_date=date(2020, 12, 31)), 1)
        self.assertEqual(self.profile.get_service_year(as_of_date=date(2021, 1, 1)), 2)
        self.assertEqual(self.profile.get_service_year(as_of_date=date(2027, 1, 1)), 8)

    def test_entitlement_progression(self):
        expected_entitlements = {
            1: 7.0,
            2: 7.0,
            3: 8.0,
            4: 9.0,
            5: 10.0,
            6: 11.0,
            7: 12.0,
            8: 13.0,
            9: 14.0,
            20: 14.0,
        }

        for service_year, expected in expected_entitlements.items():
            as_of_year = self.employment_start.year + service_year - 1
            entitlement = self.profile.calculate_annual_leave_entitlement(as_of_date=date(as_of_year, 1, 1))
            self.assertEqual(entitlement, expected)

    def test_reset_updates_annual_leave(self):
        self.profile.annual_leave_days = 2.5
        self.profile.reset_annual_leave_days(as_of_date=date(2024, 1, 1))
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.annual_leave_days, 11.0)

    def test_default_entitlement_without_employment_date(self):
        profile_no_date = EmployeeProfile.objects.create(
            user=User.objects.create(username="no-date"),
        )
        self.assertIsNone(profile_no_date.get_service_year(as_of_date=date(2024, 1, 1)))
        self.assertEqual(profile_no_date.calculate_annual_leave_entitlement(as_of_date=date(2024, 1, 1)), 7.0)
