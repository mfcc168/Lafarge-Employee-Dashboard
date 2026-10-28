from django.core.cache import cache
from django.contrib.auth.models import User
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
                    "employment_date": user.profile.employment_date.isoformat() if user.profile.employment_date else None,
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

def warm_essential_caches():
    """Warm all essential caches for application startup"""
    logger.info("Starting cache warming process...")
    
    results = {
        'users_warmed': warm_user_caches(),
    }
    
    logger.info(f"Cache warming completed: {results}")
    return results
