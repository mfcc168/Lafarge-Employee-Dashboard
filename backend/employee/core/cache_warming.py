from django.core.cache import cache
from django.contrib.auth.models import User
from employee.models import EmployeeProfile
from report.models import ReportEntry
from vacation.models import VacationRequest
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def warm_user_caches():
    """Pre-populate cache with frequently accessed user data"""
    try:
        users = User.objects.select_related('profile').all()
        warmed_count = 0
        
        for user in users:
            try:
                # Warm user profile cache
                cache_key = f'user_profile_{user.id}'
                profile_data = {
                    "username": user.username,
                    "firstname": user.first_name,
                    "lastname": user.last_name,
                    "email": user.email,
                    "role": user.profile.role,
                    "annual_leave_days": user.profile.annual_leave_days,
                }
                cache.set(cache_key, profile_data, 60 * 30)  # 30 minutes
                
                # Warm user salary cache
                salary_key = f'user_salary_{user.id}'
                salary_data = {
                    'base_salary': user.profile.base_salary,
                    'bonus_payment': user.profile.bonus_payment,
                    'transportation_allowance': user.profile.transportation_allowance,
                    'is_mpf_exempt': user.profile.is_mpf_exempt
                }
                cache.set(salary_key, salary_data, 60 * 30)  # 30 minutes
                warmed_count += 1
                
            except Exception as e:
                logger.error(f"Failed to warm cache for user {user.username}: {e}")
        
        logger.info(f"Successfully warmed cache for {warmed_count} users")
        return warmed_count
        
    except Exception as e:
        logger.error(f"Cache warming failed: {e}")
        return 0

def warm_report_caches():
    """Pre-populate cache with recent report data"""
    try:
        # Warm cache for last 7 days of report dates
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        
        dates = ReportEntry.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).values_list('date', flat=True).distinct()
        
        warmed_count = 0
        for date in dates:
            date_str = date.strftime('%Y-%m-%d')
            
            # Skip current date (no cache)
            if date == end_date:
                continue
                
            # Warm all entries for this date
            entries = ReportEntry.objects.filter(date=date).select_related('salesman')
            if entries.exists():
                cache_key = f'report_entries_date:{date_str}:salesman:all'
                cache.set(cache_key, list(entries.values()), 60 * 60)  # 1 hour
                warmed_count += 1
        
        logger.info(f"Successfully warmed report cache for {warmed_count} dates")
        return warmed_count
        
    except Exception as e:
        logger.error(f"Report cache warming failed: {e}")
        return 0

def warm_essential_caches():
    """Warm all essential caches for application startup"""
    logger.info("Starting cache warming process...")
    
    results = {
        'users_warmed': warm_user_caches(),
        'reports_warmed': warm_report_caches(),
    }
    
    logger.info(f"Cache warming completed: {results}")
    return results