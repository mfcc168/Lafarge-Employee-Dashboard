from django.core.management.base import BaseCommand
from django.core.cache import cache
from core.cache_monitoring import RedisMonitor, log_cache_metrics
from core.cache_warming import warm_essential_caches
from core.redis_config import get_redis_client
import json

class Command(BaseCommand):
    help = 'Redis cache management utilities for Lafarge Employee Dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=['stats', 'warm', 'clear', 'monitor', 'test'],
            help='Action to perform on Redis cache'
        )
        parser.add_argument(
            '--pattern',
            type=str,
            help='Key pattern to clear (use with clear action)'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output'
        )

    def handle(self, *args, **options):
        action = options['action']
        verbose = options['verbose']
        
        if action == 'stats':
            self.show_cache_stats(verbose)
        elif action == 'warm':
            self.warm_cache(verbose)
        elif action == 'clear':
            self.clear_cache(options.get('pattern'), verbose)
        elif action == 'monitor':
            self.monitor_cache(verbose)
        elif action == 'test':
            self.test_cache(verbose)

    def show_cache_stats(self, verbose=False):
        """Show current cache statistics"""
        self.stdout.write(self.style.SUCCESS('📊 Redis Cache Statistics'))
        
        monitor = RedisMonitor()
        stats = monitor.get_cache_stats()
        key_patterns = monitor.get_cache_key_patterns()
        
        if stats.get('status') == 'healthy':
            self.stdout.write(f"✅ Status: {stats['status']}")
            self.stdout.write(f"🔑 Total Keys: {stats.get('total_keys', 0)}")
            self.stdout.write(f"📈 Hit Ratio: {stats.get('hit_ratio', 0)}%")
            self.stdout.write(f"💾 Memory Used: {stats.get('used_memory_human', '0B')}")
            self.stdout.write(f"👥 Connected Clients: {stats.get('connected_clients', 0)}")
            
            if verbose:
                self.stdout.write(f"⏱️  Uptime: {stats.get('uptime_seconds', 0)} seconds")
                self.stdout.write(f"🎯 Cache Hits: {stats.get('keyspace_hits', 0)}")
                self.stdout.write(f"❌ Cache Misses: {stats.get('keyspace_misses', 0)}")
                self.stdout.write(f"⚡ Ops/Sec: {stats.get('instantaneous_ops_per_sec', 0)}")
            
            self.stdout.write('\n📋 Key Patterns:')
            for pattern, count in key_patterns.items():
                self.stdout.write(f"  {pattern}: {count} keys")
        else:
            self.stdout.write(self.style.ERROR(f"❌ Redis Status: {stats.get('status', 'unknown')}"))
            if 'error' in stats:
                self.stdout.write(self.style.ERROR(f"Error: {stats['error']}"))

    def warm_cache(self, verbose=False):
        """Warm the cache with frequently accessed data"""
        self.stdout.write(self.style.SUCCESS('🔥 Warming Cache...'))
        
        try:
            results = warm_essential_caches()
            
            self.stdout.write(f"✅ Users warmed: {results.get('users_warmed', 0)}")
            self.stdout.write(f"✅ Reports warmed: {results.get('reports_warmed', 0)}")
            
            if verbose:
                self.stdout.write(f"📝 Full results: {json.dumps(results, indent=2)}")
            
            self.stdout.write(self.style.SUCCESS('🎉 Cache warming completed!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Cache warming failed: {e}"))

    def clear_cache(self, pattern=None, verbose=False):
        """Clear cache keys"""
        if pattern:
            self.stdout.write(f'🧹 Clearing cache keys matching pattern: {pattern}')
            try:
                redis_client = get_redis_client()
                if redis_client:
                    keys = redis_client.keys(f'lafarge_cache:{pattern}')
                    if keys:
                        redis_client.delete(*keys)
                        self.stdout.write(f"✅ Cleared {len(keys)} keys")
                        if verbose:
                            for key in keys[:10]:  # Show first 10 keys
                                self.stdout.write(f"  - {key}")
                            if len(keys) > 10:
                                self.stdout.write(f"  ... and {len(keys) - 10} more")
                    else:
                        self.stdout.write("ℹ️  No keys found matching pattern")
                else:
                    self.stdout.write(self.style.ERROR("❌ Redis client unavailable"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Clear failed: {e}"))
        else:
            self.stdout.write('🧹 Clearing all cache...')
            try:
                cache.clear()
                self.stdout.write(self.style.SUCCESS('✅ All cache cleared!'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Clear failed: {e}"))

    def monitor_cache(self, verbose=False):
        """Run monitoring and log results"""
        self.stdout.write(self.style.SUCCESS('📊 Running Cache Monitoring...'))
        
        try:
            summary = log_cache_metrics()
            
            stats = summary.get('cache_stats', {})
            perf = summary.get('performance_test', {})
            
            self.stdout.write(f"✅ Redis Status: {stats.get('status', 'unknown')}")
            self.stdout.write(f"⚡ Write Performance: {perf.get('write_time_ms', 0)}ms")
            self.stdout.write(f"📖 Read Performance: {perf.get('read_time_ms', 0)}ms")
            
            if verbose:
                self.stdout.write(f"📝 Full monitoring data logged to application logs")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Monitoring failed: {e}"))

    def test_cache(self, verbose=False):
        """Test cache functionality"""
        self.stdout.write(self.style.SUCCESS('🧪 Testing Cache Functionality...'))
        
        monitor = RedisMonitor()
        perf_results = monitor.test_cache_performance()
        
        if perf_results.get('status') == 'success':
            self.stdout.write(f"✅ Write Time: {perf_results['write_time_ms']}ms")
            self.stdout.write(f"✅ Read Time: {perf_results['read_time_ms']}ms")
            self.stdout.write(f"✅ Data Integrity: {perf_results['data_integrity']}")
            
            # Performance assessment
            write_time = perf_results['write_time_ms']
            read_time = perf_results['read_time_ms']
            
            if write_time < 5 and read_time < 5:
                self.stdout.write(self.style.SUCCESS('🚀 Performance: Excellent'))
            elif write_time < 10 and read_time < 10:
                self.stdout.write(self.style.SUCCESS('✅ Performance: Good'))
            else:
                self.stdout.write(self.style.WARNING('⚠️  Performance: Could be better'))
                
        else:
            self.stdout.write(self.style.ERROR(f"❌ Test failed: {perf_results.get('error', 'Unknown error')}"))
        
        if verbose:
            self.stdout.write(f"📝 Detailed results: {json.dumps(perf_results, indent=2)}")