#!/bin/bash

# Quality Check Script for Local Development
# Run this before committing code

set -e

echo "🔍 Starting Quality & Performance Checks..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to log results
log_result() {
    local status=$1
    local message=$2
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ $message${NC}"
            ((PASSED++))
            ;;
        "FAIL")
            echo -e "${RED}❌ $message${NC}"
            ((FAILED++))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ((WARNINGS++))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    log_result "FAIL" "Not in project root directory. Please run from project root."
    exit 1
fi

log_result "INFO" "Checking project structure..."

# Frontend Quality Checks
echo -e "\n${BLUE}🎨 Frontend Quality Checks${NC}"
echo "========================="

if [ -d "frontend/employee" ]; then
    cd frontend/employee
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_result "INFO" "Installing npm dependencies..."
        npm install
    fi
    
    # TypeScript Check
    echo "Checking TypeScript..."
    if npx tsc --noEmit > /dev/null 2>&1; then
        log_result "PASS" "TypeScript type check passed"
    else
        log_result "FAIL" "TypeScript type check failed"
        echo "Run 'npx tsc --noEmit' for details"
    fi
    
    # ESLint Check
    echo "Checking ESLint..."
    if npm run lint > /dev/null 2>&1; then
        log_result "PASS" "ESLint check passed"
    else
        log_result "FAIL" "ESLint check failed"
        echo "Run 'npm run lint' for details"
    fi
    
    # Build Test
    echo "Testing build..."
    build_start=$(date +%s)
    if npm run build > /dev/null 2>&1; then
        build_end=$(date +%s)
        build_time=$((build_end - build_start))
        
        if [ $build_time -lt 60 ]; then
            log_result "PASS" "Build completed in ${build_time}s"
        elif [ $build_time -lt 120 ]; then
            log_result "WARN" "Build took ${build_time}s (>60s)"
        else
            log_result "FAIL" "Build took ${build_time}s (>120s)"
        fi
        
        # Bundle size check
        if [ -d "dist" ]; then
            total_size=$(du -sh dist | awk '{print $1}')
            log_result "INFO" "Bundle size: $total_size"
            
            # Check for large files
            large_files=$(find dist -name "*.js" -size +1M 2>/dev/null | wc -l)
            if [ $large_files -gt 0 ]; then
                log_result "WARN" "$large_files JavaScript files >1MB detected"
            fi
        fi
    else
        log_result "FAIL" "Build failed"
    fi
    
    # Security audit
    echo "Checking npm security..."
    if npm audit --audit-level=high > /dev/null 2>&1; then
        log_result "PASS" "No high/critical security vulnerabilities"
    else
        log_result "WARN" "Security vulnerabilities detected"
        echo "Run 'npm audit' for details"
    fi
    
    cd ../..
else
    log_result "WARN" "Frontend directory not found"
fi

# Backend Quality Checks
echo -e "\n${BLUE}🐍 Backend Quality Checks${NC}"
echo "========================"

if [ -d "backend/employee" ]; then
    cd backend/employee
    
    # Check if virtual environment is activated
    if [ -z "$VIRTUAL_ENV" ]; then
        log_result "WARN" "Virtual environment not detected. Consider using: python -m venv venv && source venv/bin/activate"
    fi
    
    # Check if requirements are installed
    echo "Checking Django installation..."
    if python -c "import django" > /dev/null 2>&1; then
        django_version=$(python -c "import django; print(django.get_version())")
        log_result "PASS" "Django $django_version installed"
    else
        log_result "FAIL" "Django not installed. Run: pip install -r requirements.txt"
        cd ../..
        exit 1
    fi
    
    # Django System Check
    echo "Running Django system check..."
    export DJANGO_SECRET_KEY="test-secret-for-checks-very-long-and-secure-key-for-testing-purposes-only"
    export DATABASE_URL="sqlite:///test.db"
    export DJANGO_DEBUG="false"
    export ALLOWED_HOSTS="localhost,127.0.0.1"
    
    if python manage.py check > /dev/null 2>&1; then
        log_result "PASS" "Django system check passed"
    else
        log_result "FAIL" "Django system check failed"
        echo "Run 'python manage.py check' for details"
    fi
    
    # Security Check
    echo "Running Django security check..."
    if python manage.py check --deploy > /dev/null 2>&1; then
        log_result "PASS" "Django security check passed"
    else
        log_result "WARN" "Django security check has warnings"
        echo "Run 'python manage.py check --deploy' for details"
    fi
    
    # Check for migrations
    echo "Checking for unapplied migrations..."
    if python manage.py makemigrations --dry-run > /dev/null 2>&1; then
        log_result "PASS" "No pending migrations"
    else
        log_result "WARN" "Pending migrations detected"
        echo "Run 'python manage.py makemigrations' to create them"
    fi
    
    # Import check
    echo "Checking Python imports..."
    import_errors=0
    for file in $(find . -name "*.py" -not -path "./venv/*" -not -path "./.venv/*"); do
        if ! python -m py_compile "$file" > /dev/null 2>&1; then
            log_result "FAIL" "Import error in $file"
            ((import_errors++))
        fi
    done
    
    if [ $import_errors -eq 0 ]; then
        log_result "PASS" "All Python files compile successfully"
    fi
    
    cd ../..
else
    log_result "WARN" "Backend directory not found"
fi

# Docker Configuration Check
echo -e "\n${BLUE}🐳 Docker Configuration Check${NC}"
echo "============================"

if command -v docker >/dev/null 2>&1; then
    if docker-compose config > /dev/null 2>&1; then
        log_result "PASS" "Docker Compose configuration valid"
    else
        log_result "FAIL" "Docker Compose configuration invalid"
    fi
    
    # Check for .env file in repo
    if [ -f ".env" ]; then
        log_result "FAIL" ".env file found in repository (should be in .gitignore)"
    else
        log_result "PASS" "No .env file in repository"
    fi
    
    # Check for .env.example
    if [ -f ".env.example" ]; then
        log_result "PASS" ".env.example file exists"
    else
        log_result "WARN" "No .env.example file found"
    fi
else
    log_result "WARN" "Docker not installed or not in PATH"
fi

# Git Configuration Check
echo -e "\n${BLUE}📝 Git & Project Check${NC}"
echo "======================"

# Check for large files
large_files=$(find . -type f -size +10M -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./venv/*" 2>/dev/null | wc -l)
if [ $large_files -eq 0 ]; then
    log_result "PASS" "No large files (>10MB) in repository"
else
    log_result "WARN" "$large_files large files detected in repository"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
        log_result "PASS" ".gitignore properly configured"
    else
        log_result "WARN" ".gitignore may be missing important entries"
    fi
else
    log_result "WARN" "No .gitignore file found"
fi

# Summary
echo -e "\n${BLUE}📊 Quality Check Summary${NC}"
echo "========================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All quality checks passed! Code is ready for commit.${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠️  Quality checks passed with $WARNINGS warnings. Consider addressing them.${NC}"
        exit 0
    fi
else
    echo -e "\n${RED}❌ $FAILED quality checks failed. Please fix the issues before committing.${NC}"
    exit 1
fi