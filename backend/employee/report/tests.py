from uuid import uuid4
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless

from django.contrib.auth.models import User
from django.db import IntegrityError, close_old_connections, connection, transaction
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from api.views.report_views import ReportEntryViewSet
from report.models import ReportEntry


class ReportRetryTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='report-tester')
        self.factory = APIRequestFactory()
        self.payload = {
            'date': '2026-09-24', 'client_type': 'doctor',
            'time_range': '09:00', 'client_request_id': str(uuid4()),
        }

    def create(self, payload=None, user=None):
        request = self.factory.post('/api/report-entries/', payload or self.payload, format='json')
        force_authenticate(request, user=user or self.user)
        return ReportEntryViewSet.as_view({'post': 'create'})(request)

    def update(self, entry_id, payload):
        request = self.factory.put(f'/api/report-entries/{entry_id}/', payload, format='json')
        force_authenticate(request, user=self.user)
        return ReportEntryViewSet.as_view({'put': 'update'})(request, pk=entry_id)

    def test_retry_after_lost_response_returns_same_row(self):
        first = self.create()
        retry = self.create()
        self.assertEqual(first.status_code, 201)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(retry.data['id'], first.data['id'])
        self.assertEqual(ReportEntry.objects.count(), 1)

    def test_replay_does_not_overwrite_edits_and_latest_draft_can_be_updated(self):
        first = self.create()
        edited = {**self.payload, 'time_range': '10:00'}
        self.assertEqual(self.update(first.data['id'], edited).status_code, 200)
        retry = self.create()
        self.assertEqual(retry.data['time_range'], '10:00')
        latest = {**self.payload, 'time_range': '11:00'}
        self.assertEqual(self.create(latest).data['time_range'], '10:00')
        self.assertEqual(self.update(first.data['id'], latest).status_code, 200)
        self.assertEqual(ReportEntry.objects.get().time_range, '11:00')

    def test_identical_content_with_different_draft_ids_remains_separate(self):
        self.create()
        self.create({**self.payload, 'client_request_id': str(uuid4())})
        self.assertEqual(ReportEntry.objects.count(), 2)

    def test_retry_key_is_scoped_to_authenticated_user(self):
        first = self.create()
        second = self.create(user=User.objects.create_user(username='other-tester'))
        self.assertEqual(second.status_code, 201)
        self.assertNotEqual(first.data['id'], second.data['id'])

    def test_legacy_clients_without_key_can_still_create_reports(self):
        legacy = {key: value for key, value in self.payload.items() if key != 'client_request_id'}
        self.assertEqual(self.create(legacy).status_code, 201)
        self.assertEqual(self.create(legacy).status_code, 201)
        self.assertEqual(ReportEntry.objects.count(), 2)

    def test_invalid_uuid_is_rejected(self):
        self.assertEqual(self.create({**self.payload, 'client_request_id': 'invalid'}).status_code, 400)
        self.assertEqual(ReportEntry.objects.count(), 0)

    def test_request_key_cannot_be_changed_by_update(self):
        first = self.create()
        response = self.update(first.data['id'], {**self.payload, 'client_request_id': str(uuid4())})
        self.assertEqual(response.status_code, 400)

    def test_database_enforces_one_row_per_user_and_draft(self):
        self.create()
        with self.assertRaises(IntegrityError), transaction.atomic():
            ReportEntry.objects.create(salesman=self.user, **self.payload)


@skipUnless(connection.vendor == 'postgresql', 'Concurrent write test requires PostgreSQL')
class ConcurrentReportRetryTests(TransactionTestCase):
    def test_simultaneous_create_requests_return_one_report(self):
        user = User.objects.create_user(username='concurrent-tester')
        payload = {'date': '2026-09-24', 'client_type': 'doctor',
                   'time_range': '09:00', 'client_request_id': str(uuid4())}
        start = Barrier(2)

        def submit():
            close_old_connections()
            try:
                request = APIRequestFactory().post('/api/report-entries/', payload, format='json')
                force_authenticate(request, user=user)
                start.wait(timeout=10)
                response = ReportEntryViewSet.as_view({'post': 'create'})(request)
                return response.status_code, response.data['id']
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: submit(), range(2)))
        self.assertEqual(sorted(code for code, _ in results), [200, 201])
        self.assertEqual(len({entry_id for _, entry_id in results}), 1)
        self.assertEqual(ReportEntry.objects.count(), 1)


class ReportDataFlowTests(TestCase):
    """Exercise the API boundaries where the old cache layers went stale."""
    def setUp(self):
        from rest_framework.test import APIClient
        self.user = User.objects.create_user(username='salesperson', first_name='Alex', last_name='Lee')
        self.user.profile.role = 'SALESMAN'
        self.user.profile.save()
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.payload = {'date': '2026-08-01', 'client_type': 'doctor', 'time_range': '09:00',
                        'doctor_name': 'Dr Wong', 'district': 'Central', 'client_request_id': str(uuid4())}

    def create_report(self, **changes):
        response = self.client.post('/api/report-entries/', {**self.payload, **changes}, format='json')
        self.assertEqual(response.status_code, 201)
        return response.json()

    def read_lists(self, date='2026-08-01'):
        urls = [
            '/api/all-report-entries/',
            f'/api/all-report-entries/?date={date}',
            f'/api/dashboard/report-entries/?date={date}',
            f'/api/report-entries-by-date/?start_date={date}&end_date={date}',
            f'/api/dashboard/report-entries-by-date/?start_date={date}&end_date={date}',
            f'/api/report-entries-by-date/?start_date={date}&end_date={date}&salesman_name=salesperson',
        ]
        lists = []
        for url in urls:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200, url)
            self.assertIn('no-store', response['Cache-Control'])
            lists.append(response.json())
        return lists

    def test_create_update_delete_are_immediately_visible_in_all_report_views(self):
        self.assertTrue(all(rows == [] for rows in self.read_lists()))
        saved = self.create_report()
        for rows in self.read_lists():
            self.assertEqual([row['id'] for row in rows], [saved['id']])
        self.assertEqual(self.client.get('/api/report-entry-dates/').json(), ['2026-08-01'])
        response = self.client.patch(f"/api/report-entries/{saved['id']}/", {'time_range': '10:00'}, format='json')
        self.assertEqual(response.status_code, 200)
        for rows in self.read_lists():
            self.assertEqual(rows[0]['time_range'], '10:00')
        self.assertEqual(self.client.delete(f"/api/report-entries/{saved['id']}/").status_code, 204)
        self.assertTrue(all(rows == [] for rows in self.read_lists()))
        self.assertEqual(self.client.get('/api/report-entry-dates/').json(), [])

    def test_moving_a_report_updates_both_old_and_new_dates(self):
        saved = self.create_report()
        self.read_lists()
        self.read_lists('2026-08-02')
        self.client.patch(f"/api/report-entries/{saved['id']}/", {'date': '2026-08-02'}, format='json')
        self.assertTrue(all(rows == [] for rows in self.read_lists()[1:]))
        self.assertTrue(all(len(rows) == 1 for rows in self.read_lists('2026-08-02')))
        self.assertEqual(self.client.get('/api/report-entry-dates/').json(), ['2026-08-02'])

    def test_report_requests_do_not_touch_redis_even_when_cache_is_down(self):
        from contextlib import ExitStack
        from unittest.mock import patch
        from django.core.cache import cache
        with ExitStack() as stack:
            operations = [stack.enter_context(patch.object(cache, method, side_effect=ConnectionError('Redis unavailable')))
                          for method in ('get', 'set', 'delete', 'get_many', 'set_many', 'delete_many')]
            saved = self.create_report()
            self.assertEqual(self.client.patch(f"/api/report-entries/{saved['id']}/", {'time_range': '10:00'}, format='json').status_code, 200)
            self.read_lists()
            self.assertEqual(self.client.get('/api/report-entry-dates/').status_code, 200)
            self.assertEqual(self.client.get('/api/report-entries/suggestions/').status_code, 200)
            self.assertEqual(self.client.delete(f"/api/report-entries/{saved['id']}/").status_code, 204)
            # Cover the legacy create path, which previously duplicated cache deletes.
            payload = {key: value for key, value in self.payload.items() if key != 'client_request_id'}
            self.assertEqual(self.client.post('/api/report-entries/', payload, format='json').status_code, 201)
            for operation in operations:
                operation.assert_not_called()

    def test_suggestions_are_distinct_and_scoped_without_loading_report_bodies(self):
        from django.test.utils import CaptureQueriesContext
        self.create_report()
        self.create_report(client_request_id=str(uuid4()))
        self.create_report(client_request_id=str(uuid4()), doctor_name='Older client', date='2020-01-01')
        other = User.objects.create_user(username='other')
        ReportEntry.objects.create(salesman=other, date='2026-08-01', client_type='doctor', doctor_name='Private client')
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get('/api/report-entries/suggestions/')
        self.assertEqual(response.json(), {'time_ranges': ['09:00'], 'doctor_names': ['Dr Wong', 'Older client'], 'districts': ['Central']})
        self.assertEqual(len(queries), 3)
        self.assertTrue(all('"orders"' not in query['sql'] and '"samples"' not in query['sql'] for query in queries))
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/report-entries/suggestions/').status_code, 401)

    def test_historical_pagination_does_not_mix_shapes_or_pages(self):
        self.create_report()
        self.create_report(client_request_id=str(uuid4()), time_range='10:00')
        base = '/api/all-report-entries/?date=2026-08-01'
        self.assertEqual(len(self.client.get(base).json()), 2)
        first = self.client.get(base + '&paginate=true&page_size=1&page=1').json()
        second = self.client.get(base + '&paginate=true&page_size=1&page=2').json()
        self.assertEqual(first['count'], 2)
        self.assertEqual(len(first['results']), 1)
        self.assertNotEqual(first['results'][0]['id'], second['results'][0]['id'])
        self.assertEqual(len(self.client.get(base).json()), 2)

    def test_employee_status_change_is_visible_in_previously_read_reports(self):
        self.create_report()
        self.read_lists()
        self.user.profile.is_active = False
        self.user.profile.save()
        self.assertTrue(all(rows == [] for rows in self.read_lists()))
