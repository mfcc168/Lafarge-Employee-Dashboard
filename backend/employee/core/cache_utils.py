from functools import wraps
from django.views.decorators.cache import cache_page
import logging

logger = logging.getLogger(__name__)

def safe_cache_page(timeout):
    """
    Cache decorator with graceful fallback for Redis failures.
    If Redis is unavailable, the view executes normally without caching.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            try:
                # Try to apply cache_page decorator
                cached_view = cache_page(timeout)(view_func)
                return cached_view(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Cache failed for {view_func.__name__}: {e}. Executing without cache.")
                # Execute view without caching if Redis fails
                return view_func(*args, **kwargs)
        return wrapper
    return decorator

def safe_method_cache(timeout):
    """
    Method decorator for class-based views with cache fallback.
    """
    def decorator(method):
        @wraps(method)
        def wrapper(self, request, *args, **kwargs):
            try:
                from django.utils.decorators import method_decorator
                cached_method = method_decorator(cache_page(timeout))(method)
                return cached_method(self, request, *args, **kwargs)
            except Exception as e:
                logger.warning(f"Cache failed for {method.__name__}: {e}. Executing without cache.")
                return method(self, request, *args, **kwargs)
        return wrapper
    return decorator