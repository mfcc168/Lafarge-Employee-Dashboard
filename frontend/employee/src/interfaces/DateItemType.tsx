export type DateItem = {
  type: 'full' | 'half';
  from_date?: string;
  to_date?: string;
  single_date?: string;
  half_day_period?: 'AM' | 'PM';
};
