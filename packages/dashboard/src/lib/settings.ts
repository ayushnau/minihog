/** localStorage key for default date range (days). Values: 7 | 30 | 90 */
export const DEFAULT_DATE_RANGE_KEY = 'minihog_default_date_range';

export type DefaultDateRange = '7' | '30' | '90';

export function getDefaultDateRange(): DefaultDateRange {
  if (typeof window === 'undefined') return '7';
  const v = localStorage.getItem(DEFAULT_DATE_RANGE_KEY);
  if (v === '7' || v === '30' || v === '90') return v;
  return '7';
}

export function setDefaultDateRange(value: DefaultDateRange): void {
  localStorage.setItem(DEFAULT_DATE_RANGE_KEY, value);
}
