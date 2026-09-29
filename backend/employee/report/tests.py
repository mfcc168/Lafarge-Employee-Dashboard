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
