from django.core.cache import cache
from core.redis_config import get_redis_client
from datetime import datetime, timedelta
import logging
import json

logger = logging.getLogger(__name__)

class RedisMonitor:
    """Monitor Redis performance and health for small in-house applications"""
    
    def __init__(self):
        self.redis_client = get_redis_client()
    
    def get_cache_stats(self):
        """Get comprehensive Redis statistics"""
        if not self.redis_client:
            return {'status': 'disconnected', 'error': 'Redis client unavailable'}
        
        try:
            info = self.redis_client.info()
            
            stats = {
                'status': 'healthy',
                'uptime_seconds': info.get('uptime_in_seconds', 0),
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_human': info.get('used_memory_human', '0B'),
                'used_memory_peak_human': info.get('used_memory_peak_human', '0B'),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec', 0),
            }
            
            # Calculate hit ratio
            hits = stats['keyspace_hits']
            misses = stats['keyspace_misses']
            total_requests = hits + misses
            
            if total_requests > 0:
                stats['hit_ratio'] = round((hits / total_requests) * 100, 2)
            else:
                stats['hit_ratio'] = 0
            
            # Get database info
            if 'db0' in info:
                db_info = info['db0']
                stats['total_keys'] = db_info.get('keys', 0)
                stats['expires'] = db_info.get('expires', 0)
            else:
                stats['total_keys'] = 0
                stats['expires'] = 0
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get Redis stats: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def get_cache_key_patterns(self):
        """Get cache key usage patterns"""
        if not self.redis_client:
            return {}
        
        try:
            patterns = {}
            
            # Count keys by pattern
            key_patterns = [
                'lafarge_cache:user_profile_*',
                'lafarge_cache:user_salary_*', 
                'lafarge_cache:employee_salaries',
                'lafarge_cache:report_entries_*',
                'lafarge_cache:vacation_requests*',
            ]
            
            for pattern in key_patterns:
                keys = self.redis_client.keys(pattern)
                pattern_name = pattern.replace('lafarge_cache:', '').replace('*', 'X')
                patterns[pattern_name] = len(keys)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Failed to get key patterns: {e}")
            return {}
    
    def test_cache_performance(self):
        """Test cache read/write performance"""
        if not self.redis_client:
            return {'status': 'failed', 'error': 'Redis unavailable'}
        
        try:
            test_key = 'performance_test'
            test_data = {'timestamp': datetime.now().isoformat(), 'test': True}
            
            # Test write performance
            start_time = datetime.now()
            cache.set(test_key, test_data, 60)
            write_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Test read performance
            start_time = datetime.now()
            retrieved_data = cache.get(test_key)
            read_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Cleanup
            cache.delete(test_key)
            
            return {
                'status': 'success',
                'write_time_ms': round(write_time, 2),
                'read_time_ms': round(read_time, 2),
                'data_integrity': retrieved_data == test_data
            }
            
        except Exception as e:
            logger.error(f"Cache performance test failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def get_monitoring_summary(self):
        """Get complete monitoring summary"""
        return {
            'timestamp': datetime.now().isoformat(),
            'cache_stats': self.get_cache_stats(),
            'key_patterns': self.get_cache_key_patterns(),
            'performance_test': self.test_cache_performance()
        }

def log_cache_metrics():
    """Log cache metrics for monitoring purposes"""
    monitor = RedisMonitor()
    summary = monitor.get_monitoring_summary()
    
    logger.info(f"Redis Monitoring Summary: {json.dumps(summary, indent=2)}")
    return summary