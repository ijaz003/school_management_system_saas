export const DEFAULT_TIMEZONE = 'Asia/Karachi';

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-12-31' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '31-12-2026' },
  { value: 'D MMM YYYY', label: 'D MMM YYYY', example: '31 Dec 2026' },
] as const;

export type DateFormatValue = (typeof DATE_FORMAT_OPTIONS)[number]['value'];

export const DEFAULT_DATE_FORMAT: DateFormatValue = 'DD/MM/YYYY';

/** Common zones shown first in timezone dropdowns. */
export const PINNED_TIMEZONES = [
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Jakarta',
  'Europe/London',
  'Europe/Istanbul',
  'America/New_York',
  'UTC',
] as const;

export function listTimeZones(): string[] {
  try {
    const supported =
      typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
        ? (Intl as typeof Intl & { supportedValuesOf: (key: 'timeZone') => string[] }).supportedValuesOf(
            'timeZone',
          )
        : [...PINNED_TIMEZONES];
    const pinned = PINNED_TIMEZONES.filter((zone) => supported.includes(zone));
    const rest = supported.filter((zone) => !(PINNED_TIMEZONES as readonly string[]).includes(zone));
    return [...pinned, ...rest];
  } catch {
    return [...PINNED_TIMEZONES];
  }
}

export function normalizeLocale(input?: {
  timezone?: string | null;
  dateFormat?: string | null;
} | null) {
  const timezone = input?.timezone?.trim() || DEFAULT_TIMEZONE;
  const dateFormat = (DATE_FORMAT_OPTIONS.find((option) => option.value === input?.dateFormat)?.value ??
    DEFAULT_DATE_FORMAT) as DateFormatValue;
  return { timezone, dateFormat };
}
