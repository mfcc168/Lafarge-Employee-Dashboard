from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import EmployeeProfile
from core.redis_config import safe_cache_delete
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        EmployeeProfile.objects.create(user=instance)
    else:
        instance.profile.save()
    
    # Invalidate user-related caches
    safe_cache_delete(f'user_profile_{instance.id}')
    safe_cache_delete('employee_salaries')  # Clear all employee salaries cache
    logger.info(f"Cache invalidated for user {instance.username}")

@receiver(post_save, sender=EmployeeProfile)
def invalidate_employee_cache(sender, instance, **kwargs):
    """Invalidate caches when employee profile is updated"""
    safe_cache_delete(f'user_profile_{instance.user.id}')
    safe_cache_delete(f'user_salary_{instance.user.id}')
    safe_cache_delete('employee_salaries')
    logger.info(f"Cache invalidated for employee profile {instance.user.username}")
