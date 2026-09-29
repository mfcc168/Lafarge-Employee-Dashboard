"""Isolated settings for regression tests; no production database or Redis."""
import os

os.environ.setdefault('DJANGO_SECRET_KEY', 'report-regression-tests-only')

from .settings import *  # noqa: E402,F403

DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
# CI supplies an isolated PostgreSQL service to exercise concurrent creates.
if os.getenv('REPORT_TEST_POSTGRES') == '1':
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'report_tests', 'USER': 'report_tests', 'PASSWORD': 'report-tests-only',
        'HOST': '127.0.0.1', 'PORT': '5432',
    }}
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}
ALLOWED_HOSTS = ['testserver', 'localhost']
CSRF_TRUSTED_ORIGINS = []
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
