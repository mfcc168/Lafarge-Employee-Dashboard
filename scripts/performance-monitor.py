#!/usr/bin/env python3
"""
Performance Monitoring Script
Monitors API endpoint performance and database query efficiency
"""

import os
import sys
import time
import json
import requests
import statistics
from typing import Dict, List, Tuple
from datetime import datetime
from dataclasses import dataclass

@dataclass
class PerformanceMetric:
    endpoint: str
    method: str
    response_time_ms: float
    status_code: int
    query_count: int = 0
    error: str = None

class PerformanceMonitor:
    def __init__(self, base_url: str = "http://localhost:8000", auth_token: str = None):
        self.base_url = base_url.rstrip('/')
        self.auth_token = auth_token
        self.results: List[PerformanceMetric] = []
        
        # Performance thresholds
        self.THRESHOLDS = {
            'response_time_ms': 500,  # Max 500ms response time
            'query_count': 10,        # Max 10 queries per request
            'error_rate': 0.05,       # Max 5% error rate
        }
        
    def test_endpoint(self, endpoint: str, method: str = 'GET', 
                     data: dict = None, headers: dict = None,
                     iterations: int = 3) -> List[PerformanceMetric]:
        """Test an endpoint multiple times and return metrics"""
        
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.auth_token:
            test_headers['Authorization'] = f'Bearer {self.auth_token}'
        
        if headers:
            test_headers.update(headers)
        
        metrics = []
        
        for i in range(iterations):
            try:
                start_time = time.time()
                
                if method.upper() == 'GET':
                    response = requests.get(url, headers=test_headers, timeout=10)
                elif method.upper() == 'POST':
                    response = requests.post(url, json=data, headers=test_headers, timeout=10)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                end_time = time.time()
                response_time_ms = (end_time - start_time) * 1000
                
                # Try to get query count from response headers (if Django Debug Toolbar is enabled)
                query_count = 0
                if 'X-Query-Count' in response.headers:
                    query_count = int(response.headers['X-Query-Count'])
                
                metric = PerformanceMetric(
                    endpoint=endpoint,
                    method=method.upper(),
                    response_time_ms=response_time_ms,
                    status_code=response.status_code,
                    query_count=query_count
                )
                
                metrics.append(metric)
                
                # Small delay between requests
                time.sleep(0.1)
                
            except Exception as e:
                metric = PerformanceMetric(
                    endpoint=endpoint,
                    method=method.upper(),
                    response_time_ms=0,
                    status_code=0,
                    error=str(e)
                )
                metrics.append(metric)
        
        self.results.extend(metrics)
        return metrics
    
    def get_auth_token(self, username: str = "admin", password: str = "admin123") -> str:
        """Get authentication token for testing"""
        try:
            response = requests.post(
                f"{self.base_url}/api/token/",
                json={"username": username, "password": password},
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get('access')
        except Exception as e:
            print(f"⚠️  Could not get auth token: {e}")
        return None
    
    def run_performance_tests(self) -> Dict:
        """Run comprehensive performance tests"""
        
        print("🚀 Starting Performance Tests...")
        print("=" * 50)
        
        # Try to get auth token
        if not self.auth_token:
            print("🔑 Attempting to get authentication token...")
            self.auth_token = self.get_auth_token()
            if self.auth_token:
                print("✅ Authentication successful")
            else:
                print("⚠️  No authentication - testing public endpoints only")
        
        # Define endpoints to test
        endpoints = [
            # Public endpoints
            ('/api/health/', 'GET'),
            
            # Authenticated endpoints (if we have a token)
            ('/api/protected-endpoint/', 'GET'),
            ('/api/dashboard/report-entries/', 'GET'),
            ('/api/vacations/me/', 'GET'),
        ]
        
        if not self.auth_token:
            # Filter to only public endpoints
            endpoints = [ep for ep in endpoints if 'health' in ep[0]]
        
        results = {}
        
        for endpoint, method in endpoints:
            print(f"\n📊 Testing {method} {endpoint}")
            
            try:
                metrics = self.test_endpoint(endpoint, method, iterations=5)
                
                # Calculate statistics
                successful_metrics = [m for m in metrics if m.error is None and m.status_code < 400]
                
                if successful_metrics:
                    response_times = [m.response_time_ms for m in successful_metrics]
                    avg_response_time = statistics.mean(response_times)
                    max_response_time = max(response_times)
                    min_response_time = min(response_times)
                    
                    query_counts = [m.query_count for m in successful_metrics if m.query_count > 0]
                    avg_query_count = statistics.mean(query_counts) if query_counts else 0
                    
                    success_rate = len(successful_metrics) / len(metrics)
                    
                    results[endpoint] = {
                        'avg_response_time_ms': avg_response_time,
                        'max_response_time_ms': max_response_time,
                        'min_response_time_ms': min_response_time,
                        'avg_query_count': avg_query_count,
                        'success_rate': success_rate,
                        'total_requests': len(metrics)
                    }
                    
                    # Display results
                    print(f"   ⏱️  Avg Response Time: {avg_response_time:.2f}ms")
                    print(f"   📈 Max Response Time: {max_response_time:.2f}ms")
                    print(f"   📉 Min Response Time: {min_response_time:.2f}ms")
                    if avg_query_count > 0:
                        print(f"   🗄️  Avg Query Count: {avg_query_count:.1f}")
                    print(f"   ✅ Success Rate: {success_rate:.1%}")
                    
                    # Check thresholds
                    issues = []
                    if avg_response_time > self.THRESHOLDS['response_time_ms']:
                        issues.append(f"Slow response: {avg_response_time:.0f}ms > {self.THRESHOLDS['response_time_ms']}ms")
                    
                    if avg_query_count > self.THRESHOLDS['query_count']:
                        issues.append(f"Too many queries: {avg_query_count:.0f} > {self.THRESHOLDS['query_count']}")
                    
                    if success_rate < (1 - self.THRESHOLDS['error_rate']):
                        issues.append(f"High error rate: {(1-success_rate):.1%} > {self.THRESHOLDS['error_rate']:.1%}")
                    
                    if issues:
                        print(f"   ⚠️  Issues: {', '.join(issues)}")
                    else:
                        print(f"   ✅ Performance OK")
                        
                else:
                    print(f"   ❌ All requests failed")
                    results[endpoint] = {'error': 'All requests failed'}
                    
            except Exception as e:
                print(f"   ❌ Test failed: {e}")
                results[endpoint] = {'error': str(e)}
        
        return results
    
    def generate_report(self, results: Dict) -> str:
        """Generate a performance report"""
        
        report = []
        report.append("📊 Performance Test Report")
        report.append("=" * 50)
        report.append(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Base URL: {self.base_url}")
        report.append("")
        
        # Summary
        total_endpoints = len(results)
        failed_endpoints = len([r for r in results.values() if 'error' in r])
        slow_endpoints = len([r for r in results.values() if 'avg_response_time_ms' in r and r['avg_response_time_ms'] > self.THRESHOLDS['response_time_ms']])
        
        report.append("📈 Summary:")
        report.append(f"   Total Endpoints Tested: {total_endpoints}")
        report.append(f"   Failed Endpoints: {failed_endpoints}")
        report.append(f"   Slow Endpoints (>{self.THRESHOLDS['response_time_ms']}ms): {slow_endpoints}")
        report.append("")
        
        # Detailed results
        report.append("📋 Detailed Results:")
        for endpoint, result in results.items():
            report.append(f"\n🔍 {endpoint}")
            if 'error' in result:
                report.append(f"   ❌ Error: {result['error']}")
            else:
                report.append(f"   ⏱️  Avg Response: {result['avg_response_time_ms']:.2f}ms")
                report.append(f"   📊 Success Rate: {result['success_rate']:.1%}")
                if result['avg_query_count'] > 0:
                    report.append(f"   🗄️  Avg Queries: {result['avg_query_count']:.1f}")
        
        # Recommendations
        report.append("\n💡 Recommendations:")
        if slow_endpoints > 0:
            report.append("   - Optimize slow endpoints with caching or query optimization")
        if failed_endpoints > 0:
            report.append("   - Investigate and fix failing endpoints")
        if total_endpoints == len([r for r in results.values() if 'avg_response_time_ms' in r and r['avg_response_time_ms'] < self.THRESHOLDS['response_time_ms']]):
            report.append("   ✅ All endpoints performing well!")
        
        return "\n".join(report)

def main():
    """Main function"""
    
    # Parse command line arguments
    base_url = os.getenv('API_BASE_URL', 'http://localhost:8000')
    
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    
    # Initialize monitor
    monitor = PerformanceMonitor(base_url)
    
    # Run tests
    try:
        results = monitor.run_performance_tests()
        
        # Generate and display report
        report = monitor.generate_report(results)
        print("\n" + report)
        
        # Save report to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = f"performance_report_{timestamp}.txt"
        
        with open(report_file, 'w') as f:
            f.write(report)
        
        print(f"\n📄 Report saved to: {report_file}")
        
        # Export results as JSON
        json_file = f"performance_results_{timestamp}.json"
        with open(json_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"📊 Raw results saved to: {json_file}")
        
        # Exit with appropriate code
        failed_endpoints = len([r for r in results.values() if 'error' in r])
        slow_endpoints = len([r for r in results.values() if 'avg_response_time_ms' in r and r['avg_response_time_ms'] > monitor.THRESHOLDS['response_time_ms']])
        
        if failed_endpoints > 0 or slow_endpoints > 0:
            print(f"\n❌ Performance issues detected: {failed_endpoints} failed, {slow_endpoints} slow")
            sys.exit(1)
        else:
            print(f"\n✅ All performance tests passed!")
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n⏹️  Performance tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Performance tests failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()