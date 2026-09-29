from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import ReportEntry
from core.redis_config import safe_cache_delete, safe_cache_delete_pattern
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=ReportEntry)
def capture_previous_report_date(sender, instance, **kwargs):
    """Remember the old date so moving an entry invalidates both dates."""
    instance._previous_date = None
    if instance.pk:
        previous = sender.objects.filter(pk=instance.pk).values_list('date', flat=True).first()
        instance._previous_date = previous


@receiver(post_save, sender=ReportEntry)
def invalidate_report_cache_on_save(sender, instance, **kwargs):
    """Invalidate report caches when a report entry is created or updated"""
    # Invalidate date-specific caches
    date_str = instance.date.strftime('%Y-%m-%d')
    salesman_username = instance.salesman.username
    
    # Clear all report list/range caches. The dataset is small, and broad
    # invalidation is safer than allowing a stale dashboard after a mutation.
    safe_cache_delete('report_entry_dates')
    safe_cache_delete_pattern('report_entries_date:*')
    safe_cache_delete_pattern('report_entries_range:*')

    previous_date = getattr(instance, '_previous_date', None)
    if previous_date and previous_date != instance.date:
        logger.info(
            "Report entry %s moved from %s to %s; both dates invalidated",
            instance.pk,
            previous_date,
            instance.date,
        )

    logger.info(f"Cache invalidated for report entry on {date_str} by {salesman_username}")

@receiver(post_delete, sender=ReportEntry)
def invalidate_report_cache_on_delete(sender, instance, **kwargs):
    """Invalidate report caches when a report entry is deleted"""
    # Same cache invalidation as save
    date_str = instance.date.strftime('%Y-%m-%d')
    salesman_username = instance.salesman.username
    
    safe_cache_delete('report_entry_dates')
    safe_cache_delete_pattern('report_entries_date:*')
    safe_cache_delete_pattern('report_entries_range:*')

    logger.info(f"Cache invalidated for deleted report entry on {date_str} by {salesman_username}")