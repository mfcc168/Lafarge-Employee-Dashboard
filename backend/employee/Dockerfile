FROM python:3.9-slim

WORKDIR /app

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=core.settings \
    GUNICORN_WORKERS=5 \
    GUNICORN_THREADS=2 \
    GUNICORN_TIMEOUT=120

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create staticfiles directory and migrate and collect static files
RUN mkdir -p /app/staticfiles \
    && python manage.py makemigrations && python manage.py migrate && python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["sh", "-c", \
    "gunicorn --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS} \
    --threads ${GUNICORN_THREADS} \
    --timeout ${GUNICORN_TIMEOUT} \
    --pythonpath /app \
    core.wsgi:application"]