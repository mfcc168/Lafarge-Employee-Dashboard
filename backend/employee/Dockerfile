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
RUN chmod +x /app/docker-entrypoint.sh && mkdir -p /app/staticfiles

EXPOSE 8000

CMD ["/app/docker-entrypoint.sh"]
