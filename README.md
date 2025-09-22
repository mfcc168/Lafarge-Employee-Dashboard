# 🏗️ Lafarge Employee Dashboard


A comprehensive enterprise employee management system for Lafarge, featuring advanced payroll management, sales reporting, vacation tracking, and role-based administration with sophisticated caching and performance optimizations.

## ✨ Features

### 👥 **Employee Management**
- Complete employee profile management with role assignment
- Employee status tracking (active/inactive)
- Hierarchical role-based permissions (Admin, Manager, Salesman, etc.)
- Employee search and filtering capabilities

### 💰 **Advanced Payroll System**
- MPF (Mandatory Provident Fund) calculations
- Bonus and commission tracking
- Year-end bonus management
- Professional PDF payslip generation with ReportLab
- Salary history and payment calculations

### 📊 **Sales & Reporting**
- Daily sales report entry system
- Commission tracking and calculations
- Monthly sales performance reports
- Client order tracking
- Sample distribution monitoring
- District-based reporting

### 🏖️ **Vacation Management**
- Leave request submission and approval workflow
- Half-day and full-day vacation tracking
- Annual leave balance management
- Leave type categorization
- Manager approval system

### 🔒 **Security & Authentication**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting and CSRF protection
- Content Security Policy (CSP) implementation
- Secure password handling with Argon2

### ⚡ **Performance & Caching**
- Redis-based backend caching with intelligent invalidation
- TanStack Query frontend caching with 2-minute stale time
- Chunk loading error recovery with automatic retries
- Bundle optimization and code splitting
- Cache versioning for seamless updates

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.x with Django REST Framework
- **Database**: PostgreSQL 13+ with SSL support
- **Caching**: Redis 7 with password authentication
- **Authentication**: JWT with djangorestframework-simplejwt
- **Security**: django-ratelimit, django-csp, Argon2 password hashing
- **PDF Generation**: ReportLab for payslip creation
- **Email**: django-anymail for notifications
- **Testing**: pytest, pytest-django, factory-boy

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6 with SWC/Terser optimization
- **Styling**: Tailwind CSS 4 with custom components
- **State Management**: TanStack Query v5 for server state
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **HTTP Client**: Axios with interceptors

### DevOps & Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose with health checks
- **Web Server**: Nginx for frontend serving
- **WSGI Server**: Gunicorn with worker optimization
- **Database**: PostgreSQL with automated backups
- **Monitoring**: Performance monitoring scripts

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Lafarge-Employee-Dashboard.git
   cd Lafarge-Employee-Dashboard
   ```

2. **Create environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   # Development with hot reload
   docker-compose up -d
   
   # Production deployment
   bash scripts/deploy-production.sh
   ```

4. **Access the application**
   - **Frontend**: http://localhost (port 80 in production)
   - **Backend API**: http://localhost/api/
   - **Admin Interface**: http://localhost/admin/
   - **Health Check**: http://localhost/api/health/

### Development Workflow

#### Frontend Development
```bash
cd frontend/employee
npm install                 # Install dependencies
npm run dev                # Start development server (http://localhost:5173)
npm run typecheck          # TypeScript type checking
npm run lint               # ESLint code linting
npm run build              # Production build
npm run quality:check      # Run all quality checks
```

#### Backend Development
```bash
cd backend/employee
pip install -r requirements.txt  # Install Python dependencies
python manage.py migrate         # Apply database migrations
python manage.py createsuperuser # Create admin user
python manage.py runserver       # Start development server
python manage.py test            # Run tests
```

#### Quality Assurance
```bash
# Run comprehensive quality checks
bash scripts/quality-check.sh

# Performance monitoring
python scripts/performance-monitor.py
```

## 📋 Environment Variables

### Backend Configuration
```env
# Database
DB_NAME=lafarge_db
DB_USER=lafarge_user
DB_PASSWORD=secure_password
DB_HOST=db
DB_PORT=5432

# Security
DJANGO_SECRET_KEY=your-very-long-secret-key
DJANGO_DEBUG=false
JWT_SECRET_KEY=your-jwt-secret-key

# Cache
REDIS_PASSWORD=redis_password
REDIS_HOST=redis
REDIS_PORT=6379

# Server
ALLOWED_HOSTS=localhost,yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

### Frontend Configuration
```env
VITE_API_URL=http://localhost/api
VITE_BACKEND_URL=http://localhost
```

## 🏗️ Architecture Overview

### Project Structure
```
Lafarge-Employee-Dashboard/
├── backend/employee/           # Django backend application
│   ├── core/                  # Django project settings & configuration
│   ├── api/                   # API views and serializers
│   ├── employee/              # Employee models and business logic
│   ├── report/                # Sales reporting functionality
│   ├── vacation/              # Vacation management system
│   ├── management/            # Custom Django commands
│   └── requirements.txt       # Python dependencies
├── frontend/employee/         # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page-level components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React context providers
│   │   ├── interfaces/        # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── dist/                  # Production build output
│   └── package.json           # Frontend dependencies
├── scripts/                   # Deployment and utility scripts
├── docker-compose.yml         # Container orchestration
└── README.md                  # This file
```

### Key Components

#### Backend Apps
- **`api/`**: RESTful API endpoints with DRF viewsets
- **`employee/`**: Employee models, authentication, and profile management
- **`report/`**: Sales reporting with commission calculations
- **`vacation/`**: Leave management with approval workflows

#### Frontend Features
- **Lazy Loading**: Route-based code splitting with retry logic
- **Error Boundaries**: Graceful chunk loading error recovery
- **Role-Based Rendering**: Dynamic UI based on user permissions
- **Optimistic Updates**: Immediate UI feedback with rollback capability

## 🔧 Advanced Configuration

### Cache Strategy
The application implements a sophisticated multi-layer caching strategy:

#### Frontend Caching (TanStack Query)
```typescript
// Query configuration
{
  staleTime: 1000 * 60 * 2,     // 2 minutes
  gcTime: 1000 * 60 * 60 * 24,  // 24 hours
  refetchOnWindowFocus: false,   // Prevent unnecessary refetches
}
```

#### Backend Caching (Redis)
- **Query Result Caching**: 5-minute TTL for expensive database queries
- **Session Caching**: User session and permission caching
- **API Response Caching**: Configurable per-endpoint caching

#### Cache Debugging
```javascript
// Browser console commands
__cacheDebug.getStats()  // View cache statistics
__cacheDebug.clear()     // Clear all frontend cache
```

### Performance Optimizations

#### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Unused code elimination with Vite
- **Asset Optimization**: Image optimization and compression
- **Chunk Retry Logic**: Automatic recovery from failed chunk loads

#### Database Optimization
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Selective prefetch and joins
- **Index Strategy**: Optimized database indexes for common queries

## 🧪 Testing

### Backend Testing
```bash
cd backend/employee

# Run all tests
python manage.py test

# Run with coverage
pytest --cov=. --cov-report=html

# Specific test modules
python manage.py test employee.tests
python manage.py test report.tests
python manage.py test vacation.tests
```

### Frontend Testing
```bash
cd frontend/employee

# Type checking
npm run typecheck

# Linting
npm run lint

# Build testing
npm run build
```

### Integration Testing
```bash
# Complete quality pipeline
bash scripts/quality-check.sh

# Performance testing
python scripts/performance-monitor.py
```

## 🚀 Deployment

### Production Deployment
```bash
# Automated production deployment with health checks
bash scripts/deploy-production.sh
```

### Manual Deployment Steps
```bash
# 1. Build and start services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 2. Database migrations
docker-compose exec backend python manage.py migrate

# 3. Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# 4. Create superuser (if needed)
docker-compose exec backend python manage.py createsuperuser

# 5. Health check
curl http://localhost/api/health/
```

### Container Management
```bash
# View logs
docker-compose logs -f [service_name]

# Scale services
docker-compose up -d --scale backend=3

# Database backup
docker-compose exec db pg_dump -U $DB_USER $DB_NAME > backup.sql

# Redis cache clear
docker-compose exec redis redis-cli -a $REDIS_PASSWORD FLUSHALL
```

## 🔍 Monitoring & Debugging

### Performance Monitoring
```bash
# Monitor system performance
python scripts/performance-monitor.py

# Database query analysis
docker-compose exec backend python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)
```

### Cache Monitoring
```bash
# Redis cache statistics
docker-compose exec redis redis-cli -a $REDIS_PASSWORD INFO memory

# Frontend cache debugging (browser console)
__cacheDebug.getStats()
```

### Log Analysis
```bash
# Application logs
docker-compose logs -f backend

# Nginx access logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f db
```

## 🔒 Security Considerations

### Authentication & Authorization
- JWT tokens with secure refresh mechanism
- Role-based access control with granular permissions
- Rate limiting to prevent abuse
- CSRF protection on all state-changing operations

### Data Protection
- Password hashing with Argon2
- SQL injection prevention with ORM
- XSS protection with Content Security Policy
- Sensitive data encryption in transit and at rest

### Infrastructure Security
- Container security with non-root users
- Database SSL connections
- Redis password authentication
- Environment variable security


## 📄 License

**Proprietary - Lafarge Internal Use Only**

This software is proprietary to Lafarge and is intended solely for internal business operations. Unauthorized copying, distribution, or use is strictly prohibited.

---
