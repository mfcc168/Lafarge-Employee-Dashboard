FROM python:3.12-slim

WORKDIR /app

ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=core.settings \
    GUNICORN_WORKERS=2 \
    GUNICORN_THREADS=2 \
    GUNICORN_TIMEOUT=120

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/staticfiles

EXPOSE 8000

CMD ["sh", "-c", "if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then python manage.py migrate --noinput; else echo 'Skipping Django migrations (RUN_MIGRATIONS=false)'; fi && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS} --threads ${GUNICORN_THREADS} --timeout ${GUNICORN_TIMEOUT} --pythonpath /app core.wsgi:application"]
