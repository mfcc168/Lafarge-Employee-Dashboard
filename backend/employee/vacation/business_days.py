import requests
from datetime import datetime, timedelta
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class BusinessDaysCalculator:
    _holidays_cache = []
    _last_fetch = None
    _cache_duration = timedelta(hours=24)
    
    @classmethod
    def fetch_hong_kong_holidays(cls) -> List[Dict[str, str]]:
        """Fetch Hong Kong public holidays from government API with caching"""
        now = datetime.now()
        
        # Return cached data if it's still fresh
        if (cls._holidays_cache and cls._last_fetch and 
            (now - cls._last_fetch) < cls._cache_duration):
            return cls._holidays_cache
        
        try:
            response = requests.get('https://www.1823.gov.hk/common/ical/en.json', timeout=10)
            response.raise_for_status()
            
            data = response.json()
            holidays = []
            
            if 'vcalendar' in data and data['vcalendar'] and 'vevent' in data['vcalendar'][0]:
                events = data['vcalendar'][0]['vevent']
                
                for event in events:
                    if 'dtstart' in event and 'summary' in event:
                        date_str = event['dtstart'][0]
                        # Convert YYYYMMDD format to YYYY-MM-DD
                        formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
                        
                        holidays.append({
                            'date': formatted_date,
                            'name': event['summary']
                        })
            
            cls._holidays_cache = holidays
            cls._last_fetch = now
            
            return holidays
            
        except Exception as e:
            logger.error(f"Failed to fetch Hong Kong holidays: {e}")
            
            # Fallback to some basic holidays if fetch fails
            current_year = now.year
            return [
                {'date': f'{current_year}-01-01', 'name': 'The first day of January'},
                {'date': f'{current_year}-05-01', 'name': 'Labour Day'},
                {'date': f'{current_year}-07-01', 'name': 'Hong Kong Special Administrative Region Establishment Day'},
                {'date': f'{current_year}-10-01', 'name': 'National Day'},
                {'date': f'{current_year}-12-25', 'name': 'Christmas Day'},
                {'date': f'{current_year}-12-26', 'name': 'The first weekday after Christmas Day'}
            ]
    
    @classmethod
    def is_weekend(cls, date: datetime) -> bool:
        """Check if date is a weekend (Saturday=5, Sunday=6)"""
        return date.weekday() >= 5
    
    @classmethod
    def is_hong_kong_public_holiday(cls, date: datetime, holidays: List[Dict[str, str]]) -> bool:
        """Check if date is a Hong Kong public holiday"""
        date_str = date.strftime('%Y-%m-%d')
        return any(holiday['date'] == date_str for holiday in holidays)
    
    @classmethod
    def is_business_day(cls, date: datetime, holidays: List[Dict[str, str]]) -> bool:
        """Check if date is a business day (not weekend and not public holiday)"""
        return not cls.is_weekend(date) and not cls.is_hong_kong_public_holiday(date, holidays)
    
    @classmethod
    def calculate_business_days(cls, start_date: datetime, end_date: datetime) -> int:
        """Calculate number of business days between two dates (inclusive)"""
        if start_date > end_date:
            return 0
        
        holidays = cls.fetch_hong_kong_holidays()
        business_days = 0
        current_date = start_date
        
        while current_date <= end_date:
            if cls.is_business_day(current_date, holidays):
                business_days += 1
            current_date += timedelta(days=1)
        
        return business_days
    
    @classmethod
    def get_holidays_in_range(cls, start_date: datetime, end_date: datetime) -> List[Dict[str, str]]:
        """Get all Hong Kong holidays within the specified date range"""
        holidays = cls.fetch_hong_kong_holidays()
        
        return [
            holiday for holiday in holidays
            if start_date <= datetime.strptime(holiday['date'], '%Y-%m-%d').date() <= end_date
        ]