from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ReportEntry
from core.redis_config import safe_cache_delete
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ReportEntry)
def invalidate_report_cache_on_save(sender, instance, **kwargs):
    """Invalidate report caches when a report entry is created or updated"""
    # Invalidate date-specific caches
    date_str = instance.date.strftime('%Y-%m-%d')
    salesman_username = instance.salesman.username
    
    # Clear specific cache keys
    safe_cache_delete('report_entry_dates')
    safe_cache_delete(f'report_entries_date:{date_str}:salesman:all')
    safe_cache_delete(f'report_entries_date:{date_str}:salesman:{salesman_username}')
    
    # Clear date range caches that might include this date
    # Note: We could be more sophisticated here, but for simplicity, we'll clear key patterns
    logger.info(f"Cache invalidated for report entry on {date_str} by {salesman_username}")

@receiver(post_delete, sender=ReportEntry)
def invalidate_report_cache_on_delete(sender, instance, **kwargs):
    """Invalidate report caches when a report entry is deleted"""
    # Same cache invalidation as save
    date_str = instance.date.strftime('%Y-%m-%d')
    salesman_username = instance.salesman.username
    
    safe_cache_delete('report_entry_dates')
    safe_cache_delete(f'report_entries_date:{date_str}:salesman:all')
    safe_cache_delete(f'report_entries_date:{date_str}:salesman:{salesman_username}')
    
    logger.info(f"Cache invalidated for deleted report entry on {date_str} by {salesman_username}")