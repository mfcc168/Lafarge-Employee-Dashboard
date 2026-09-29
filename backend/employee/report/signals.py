from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ReportEntry
from core.redis_config import safe_cache_delete
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ReportEntry)
def invalidate_report_cache_on_save(sender, instance, **kwargs):
    """Invalidate the small cached report-date list after a report mutation."""
    safe_cache_delete('report_entry_dates')
    logger.info(
        "Report date cache invalidated after save of entry %s",
        instance.pk,
    )


@receiver(post_delete, sender=ReportEntry)
def invalidate_report_cache_on_delete(sender, instance, **kwargs):
    """Invalidate the small cached report-date list after a report deletion."""
    safe_cache_delete('report_entry_dates')
    logger.info(
        "Report date cache invalidated after delete of entry %s",
        instance.pk,
    )
