from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class OptimizedPageNumberPagination(PageNumberPagination):
    """
    Optimized pagination for report entries.
    Allows client to control page size with reasonable limits.
    """
    page_size = 50  # Default page size
    page_size_query_param = 'page_size'
    max_page_size = 200  # Maximum allowed page size
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page_size,
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })


class DailyReportPagination(OptimizedPageNumberPagination):
    """
    Pagination specifically for daily reports.
    Since daily reports are typically smaller, we can load more at once.
    """
    page_size = 100  # Higher default for daily views
    max_page_size = 500  # Allow loading entire day at once if needed