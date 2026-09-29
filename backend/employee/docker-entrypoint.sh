#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running Django migrations..."
  python manage.py migrate --noinput
else
  echo "Skipping Django migrations (RUN_MIGRATIONS=false)"
fi

python manage.py collectstatic --noinput

exec gunicorn \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-2}" \
  --threads "${GUNICORN_THREADS:-2}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --pythonpath /app \
  core.wsgi:application
