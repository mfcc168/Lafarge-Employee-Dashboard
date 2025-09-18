import redis
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def get_redis_client():
    """
    Get Redis client with error handling for small in-house applications.
    Returns None if Redis is unavailable to allow graceful fallback.
    """
    try:
        client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        client.ping()
        return client
    except redis.ConnectionError as e:
        logger.warning(f"Redis connection failed: {e}. Application will continue without caching.")
        return None
    except Exception as e:
        logger.error(f"Unexpected Redis error: {e}")
        return None

def safe_cache_get(key, default=None):
    """Safe cache get with fallback"""
    try:
        from django.core.cache import cache
        return cache.get(key, default)
    except Exception as e:
        logger.warning(f"Cache get failed for key {key}: {e}")
        return default

def safe_cache_set(key, value, timeout=300):
    """Safe cache set with error handling"""
    try:
        from django.core.cache import cache
        cache.set(key, value, timeout)
        return True
    except Exception as e:
        logger.warning(f"Cache set failed for key {key}: {e}")
        return False

def safe_cache_delete(key):
    """Safe cache delete with error handling"""
    try:
        from django.core.cache import cache
        cache.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache delete failed for key {key}: {e}")
        return False