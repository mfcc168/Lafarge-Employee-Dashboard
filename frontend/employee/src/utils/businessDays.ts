export interface HongKongHoliday {
  date: string;
  name: string;
}

let holidaysCache: HongKongHoliday[] = [];
let lastFetch: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchHongKongHolidays(): Promise<HongKongHoliday[]> {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (holidaysCache.length > 0 && (now - lastFetch) < CACHE_DURATION) {
    return holidaysCache;
  }
  
  try {
    const response = await fetch('https://www.1823.gov.hk/common/ical/en.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const holidays: HongKongHoliday[] = [];
    
    if (data.vcalendar && data.vcalendar[0] && data.vcalendar[0].vevent) {
      const events = data.vcalendar[0].vevent;
      
      events.forEach((event: any) => {
        if (event.dtstart && event.summary) {
          const dateStr = event.dtstart[0];
          // Convert YYYYMMDD format to YYYY-MM-DD
          const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
          
          holidays.push({
            date: formattedDate,
            name: event.summary
          });
        }
      });
    }
    
    holidaysCache = holidays;
    lastFetch = now;
    
    return holidays;
  } catch (error) {
    console.error('Failed to fetch Hong Kong holidays:', error);
    
    // Fallback to some basic holidays if fetch fails
    const currentYear = new Date().getFullYear();
    return [
      { date: `${currentYear}-01-01`, name: 'The first day of January' },
      { date: `${currentYear}-05-01`, name: 'Labour Day' },
      { date: `${currentYear}-07-01`, name: 'Hong Kong Special Administrative Region Establishment Day' },
      { date: `${currentYear}-10-01`, name: 'National Day' },
      { date: `${currentYear}-12-25`, name: 'Christmas Day' },
      { date: `${currentYear}-12-26`, name: 'The first weekday after Christmas Day' }
    ];
  }
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

export function isHongKongPublicHoliday(date: Date, holidays: HongKongHoliday[]): boolean {
  const dateString = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.date === dateString);
}

export function isBusinessDay(date: Date, holidays: HongKongHoliday[]): boolean {
  return !isWeekend(date) && !isHongKongPublicHoliday(date, holidays);
}

export async function calculateBusinessDays(startDate: string, endDate: string): Promise<number> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 0;
  }
  
  const holidays = await fetchHongKongHolidays();
  let businessDays = 0;
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    if (isBusinessDay(currentDate, holidays)) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}

export async function getHongKongHolidaysInRange(startDate: string, endDate: string): Promise<HongKongHoliday[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const holidays = await fetchHongKongHolidays();
  
  return holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= start && holidayDate <= end;
  });
}

export interface ExcludedDate {
  date: string;
  reason: 'Weekend' | 'Holiday';
  name?: string;
}

export async function getExcludedDatesInRange(startDate: string, endDate: string): Promise<ExcludedDate[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const holidays = await fetchHongKongHolidays();
  const excludedDates: ExcludedDate[] = [];
  
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    if (isWeekend(currentDate)) {
      excludedDates.push({
        date: currentDate.toISOString().split('T')[0],
        reason: 'Weekend'
      });
    } else if (isHongKongPublicHoliday(currentDate, holidays)) {
      const holiday = holidays.find(h => h.date === currentDate.toISOString().split('T')[0]);
      excludedDates.push({
        date: currentDate.toISOString().split('T')[0],
        reason: 'Holiday',
        name: holiday?.name
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return excludedDates;
}