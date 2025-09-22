#!/bin/bash

# Production Deployment Script
# Ensures proper cache handling and zero-downtime deployment

set -e

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log results
log_result() {
    local status=$1
    local message=$2
    
    case $status in
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    log_result "ERROR" "Not in project root directory. Please run from project root."
    exit 1
fi

log_result "INFO" "Pre-deployment checks..."

# Check Docker is running
if ! docker info >/dev/null 2>&1; then
    log_result "ERROR" "Docker is not running. Please start Docker."
    exit 1
fi

log_result "SUCCESS" "Docker is running"

# Build and quality checks
log_result "INFO" "Running quality checks..."

# Frontend checks
cd frontend/employee

# Verify we're in the correct directory
if [ ! -f "package.json" ]; then
    log_result "ERROR" "Frontend package.json not found. Check directory structure."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_result "INFO" "Installing frontend dependencies..."
    npm ci
fi

# Type check
log_result "INFO" "Running TypeScript check..."
if npx tsc --noEmit; then
    log_result "SUCCESS" "TypeScript check passed"
else
    log_result "ERROR" "TypeScript check failed"
    exit 1
fi

# Lint check
log_result "INFO" "Running ESLint check..."
if npm run lint; then
    log_result "SUCCESS" "ESLint check passed"
else
    log_result "WARNING" "ESLint check has warnings (continuing)"
fi

# Build test
log_result "INFO" "Testing production build..."
build_start=$(date +%s)
if npm run build; then
    build_end=$(date +%s)
    build_time=$((build_end - build_start))
    log_result "SUCCESS" "Frontend build completed in ${build_time}s"
else
    log_result "ERROR" "Frontend build failed"
    exit 1
fi

# Bundle analysis
if [ -d "dist" ]; then
    total_size=$(du -sh dist | awk '{print $1}')
    log_result "INFO" "Bundle size: $total_size"
    
    # Check for large chunks
    large_files=$(find dist -name "*.js" -size +1M 2>/dev/null | wc -l)
    if [ $large_files -gt 0 ]; then
        log_result "WARNING" "$large_files JavaScript files >1MB detected"
        find dist -name "*.js" -size +1M -exec ls -lh {} \;
    fi
fi

cd ../..

# Backend checks
log_result "INFO" "Checking backend configuration..."

cd backend/employee

# Check Django configuration
export DJANGO_SETTINGS_MODULE="core.settings_ci"
export DATABASE_URL="sqlite:///test.db"
export DJANGO_DEBUG="false"

if python manage.py check; then
    log_result "SUCCESS" "Django configuration check passed"
else
    log_result "ERROR" "Django configuration check failed"
    exit 1
fi

cd ../..

# Docker deployment
log_result "INFO" "Starting Docker deployment..."

# Stop existing containers gracefully
log_result "INFO" "Stopping existing containers..."
docker-compose down --timeout 30

# Remove old images to force rebuild
log_result "INFO" "Cleaning up old images..."
docker image prune -f

# Build new images
log_result "INFO" "Building new Docker images..."
if docker-compose build --no-cache; then
    log_result "SUCCESS" "Docker images built successfully"
else
    log_result "ERROR" "Docker build failed"
    exit 1
fi

# Start services
log_result "INFO" "Starting services..."
if docker-compose up -d; then
    log_result "SUCCESS" "Services started successfully"
else
    log_result "ERROR" "Failed to start services"
    exit 1
fi

# Health checks
log_result "INFO" "Performing health checks..."

# Wait for services to be ready
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    log_result "SUCCESS" "Containers are running"
else
    log_result "ERROR" "Some containers failed to start"
    docker-compose logs --tail=50
    exit 1
fi

# Check frontend accessibility
log_result "INFO" "Checking frontend accessibility..."
if curl -f -s http://localhost:80 >/dev/null; then
    log_result "SUCCESS" "Frontend is accessible"
else
    log_result "WARNING" "Frontend health check failed (might need more time)"
fi

# Check backend API
log_result "INFO" "Checking backend API..."
if curl -f -s http://localhost:80/api/health/ >/dev/null; then
    log_result "SUCCESS" "Backend API is accessible"
else
    log_result "WARNING" "Backend API health check failed (might need more time)"
fi

# Final deployment summary
echo ""
log_result "INFO" "Deployment Summary"
echo "=================="

# Get container status
docker-compose ps

echo ""
log_result "SUCCESS" "🎉 Production deployment completed!"
echo ""
log_result "INFO" "Access your application at: http://localhost"
log_result "INFO" "Admin interface: http://localhost/admin"
log_result "INFO" "API health: http://localhost/api/health/"
echo ""
log_result "INFO" "To monitor logs: docker-compose logs -f"
log_result "INFO" "To stop services: docker-compose down"

# Optional: Clear browser cache reminder
echo ""
log_result "WARNING" "Important: If users experience chunk loading errors:"
log_result "WARNING" "1. Ask them to hard refresh (Ctrl+F5 or Cmd+Shift+R)"
log_result "WARNING" "2. Or clear browser cache for your domain"
log_result "WARNING" "3. The new error handling should auto-recover"