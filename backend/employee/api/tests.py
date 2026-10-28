from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APITestCase

from employee.models import EmployeeProfile


class PayrollFreshnessTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(username='payroll-admin')
        self.admin.profile.role = 'ADMIN'
        self.admin.profile.is_active = False
        self.admin.profile.save()
        self.employee = User.objects.create_user(username='payroll-employee')
        self.profile = self.employee.profile
        self.profile.base_salary = '22000.00'
        self.profile.save()
        self.client.force_authenticate(self.admin)
        self.addCleanup(cache.clear)

    def test_deactivation_and_reactivation_are_visible_on_the_next_request(self):
        url = '/api/salaries/'
        toggle_url = f'/api/profile/{self.profile.pk}/toggle-status/'
        self.assertEqual([row['id'] for row in self.client.get(url).json()], [self.profile.pk])

        self.assertEqual(self.client.post(toggle_url).status_code, 200)
        self.assertEqual(self.client.get(url).json(), [])

        self.assertEqual(self.client.post(toggle_url).status_code, 200)
        self.assertEqual([row['id'] for row in self.client.get(url).json()], [self.profile.pk])

    def test_employee_detail_changes_are_visible_without_waiting_for_a_cache_timeout(self):
        url = '/api/salaries/'
        self.assertEqual(self.client.get(url).json()[0]['base_salary'], '22000.00')
        response = self.client.patch(
            f'/api/profile/{self.profile.pk}/update/',
            {'base_salary': '25000.00', 'bonus_payment': '1500.00', 'is_mpf_exempt': True},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

        row = self.client.get(url).json()[0]
        self.assertEqual(row['base_salary'], '25000.00')
        self.assertEqual(row['bonus_payment'], '1500.00')
        self.assertTrue(row['is_mpf_exempt'])

    def test_direct_database_updates_are_visible_without_cache_invalidation(self):
        # Covers changes made outside the dashboard, including Django admin.
        self.client.get('/api/salaries/')
        EmployeeProfile.objects.filter(pk=self.profile.pk).update(is_active=False)
        self.assertEqual(self.client.get('/api/salaries/').json(), [])

    def test_salary_responses_instruct_browsers_and_proxies_not_to_store_them(self):
        for url in ['/api/salaries/', '/api/salary/me']:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                self.assertIn('no-store', response['Cache-Control'])
                self.assertIn('no-cache', response['Cache-Control'])
                self.assertIn('private', response['Cache-Control'])

    def test_own_salary_is_fresh_and_isolated_between_users(self):
        self.client.force_authenticate(self.employee)
        self.assertEqual(self.client.get('/api/salary/me').json()['base_salary'], 22000)
        EmployeeProfile.objects.filter(pk=self.profile.pk).update(base_salary='27000.00')
        self.assertEqual(self.client.get('/api/salary/me').json()['base_salary'], 27000)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get('/api/salary/me').json()['base_salary'], 0)

    def test_a_previous_payroll_response_cannot_bypass_role_checks(self):
        self.assertEqual(self.client.get('/api/salaries/').status_code, 200)
        self.client.force_authenticate(self.employee)
        self.assertEqual(self.client.get('/api/salaries/').status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/salaries/').status_code, 401)
