#!/usr/bin/env python
"""Script to clear Redis cache"""

import os
import django
import sys

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.cache import cache
from core.redis_config import get_redis_connection

def clear_all_cache():
    """Clear all Redis cache entries"""
    try:
        # Try to get Redis connection
        redis_conn = get_redis_connection()
        if redis_conn:
            # Clear all keys
            redis_conn.flushdb()
            print("✓ Successfully cleared all Redis cache entries")
        else:
            # Fallback to Django cache
            cache.clear()
            print("✓ Successfully cleared Django cache")
    except Exception as e:
        print(f"✗ Error clearing cache: {str(e)}")
        return False
    return True

if __name__ == "__main__":
    print("Clearing Redis cache...")
    if clear_all_cache():
        print("Cache cleared successfully!")
    else:
        print("Failed to clear cache!")