export const DEFAULT_TIMEZONE = 'Asia/Karachi';

export const DATE_FORMAT_VALUES = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'D MMM YYYY',
] as const;

export type DateFormatValue = (typeof DATE_FORMAT_VALUES)[number];

export const DEFAULT_DATE_FORMAT: DateFormatValue = 'DD/MM/YYYY';

export function isValidIanaTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function isValidDateFormat(value: string): value is DateFormatValue {
  return (DATE_FORMAT_VALUES as readonly string[]).includes(value);
}

export function normalizeTenantLocale(settings?: {
  timezone?: string;
  dateFormat?: string;
} | null) {
  const timezone =
    settings?.timezone && isValidIanaTimeZone(settings.timezone)
      ? settings.timezone
      : DEFAULT_TIMEZONE;
  const dateFormat =
    settings?.dateFormat && isValidDateFormat(settings.dateFormat)
      ? settings.dateFormat
      : DEFAULT_DATE_FORMAT;

  return { timezone, dateFormat };
}
