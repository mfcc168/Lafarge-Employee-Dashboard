from django.http import JsonResponse
from django.core.cache import cache
from core.redis_config import get_redis_client
from core.cache_monitoring import RedisMonitor, log_cache_metrics
from core.cache_warming import warm_essential_caches
import logging

logger = logging.getLogger(__name__)

def redis_health(request):
    """
    Simple Redis health check endpoint for monitoring.
    Returns Redis status and basic connection info.
    """
    try:
        # Test basic cache operations
        test_key = 'health_check_test'
        test_value = 'ok'
        
        # Try to set and get a test value
        cache.set(test_key, test_value, 10)
        result = cache.get(test_key)
        
        if result == test_value:
            # Clean up test key
            cache.delete(test_key)
            
            # Get additional Redis info if available
            redis_client = get_redis_client()
            if redis_client:
                info = redis_client.info()
                return JsonResponse({
                    'redis': 'healthy',
                    'connected_clients': info.get('connected_clients', 'unknown'),
                    'used_memory_human': info.get('used_memory_human', 'unknown'),
                    'uptime_in_seconds': info.get('uptime_in_seconds', 'unknown')
                })
            else:
                return JsonResponse({'redis': 'healthy'})
        else:
            return JsonResponse({'redis': 'unhealthy', 'error': 'Cache read/write test failed'})
            
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return JsonResponse({
            'redis': 'unhealthy', 
            'error': str(e)
        })

def app_health(request):
    """
    Overall application health check including Redis status.
    """
    try:
        # Check Redis
        redis_status = 'unknown'
        try:
            cache.set('app_health_check', 'ok', 5)
            result = cache.get('app_health_check')
            redis_status = 'healthy' if result == 'ok' else 'unhealthy'
            cache.delete('app_health_check')
        except Exception as e:
            redis_status = f'unhealthy: {str(e)}'
        
        # Overall status
        overall_status = 'healthy' if 'healthy' in redis_status else 'degraded'
        
        return JsonResponse({
            'status': overall_status,
            'services': {
                'redis': redis_status,
                'django': 'healthy'
            }
        })
        
    except Exception as e:
        logger.error(f"App health check failed: {e}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        })

def redis_metrics(request):
    """
    Detailed Redis metrics and monitoring endpoint.
    """
    monitor = RedisMonitor()
    summary = monitor.get_monitoring_summary()
    return JsonResponse(summary)

def cache_warm(request):
    """
    Manually trigger cache warming for better performance.
    """
    if request.method == 'POST':
        try:
            results = warm_essential_caches()
            return JsonResponse({
                'status': 'success',
                'message': 'Cache warming completed',
                'results': results
            })
        except Exception as e:
            logger.error(f"Cache warming failed: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Cache warming failed: {str(e)}'
            })
    else:
        return JsonResponse({
            'status': 'error',
            'message': 'POST method required'
        })

def cache_stats(request):
    """
    Quick cache statistics for monitoring dashboard.
    """
    monitor = RedisMonitor()
    stats = monitor.get_cache_stats()
    key_patterns = monitor.get_cache_key_patterns()
    
    return JsonResponse({
        'redis_status': stats.get('status', 'unknown'),
        'hit_ratio': stats.get('hit_ratio', 0),
        'total_keys': stats.get('total_keys', 0),
        'used_memory': stats.get('used_memory_human', '0B'),
        'connected_clients': stats.get('connected_clients', 0),
        'key_patterns': key_patterns
    })