import {
  DEFAULT_TIMEZONE,
  type DateFormatValue,
  normalizeLocale,
} from './tenant-locale';

export type DateTimeLocale = {
  timezone: string;
  dateFormat: DateFormatValue;
};

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Date-only (YYYY-MM-DD) — treat as calendar date, not UTC midnight shift.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    const date = new Date(year, (month ?? 1) - 1, day ?? 1);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }

  const monthIndex = Number(map.month ?? '1') - 1;
  const monthShort = new Date(Date.UTC(2000, monthIndex, 1)).toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });

  return {
    year: map.year ?? '',
    month: map.month ?? '',
    day: map.day ?? '',
    hour: (map.hour ?? '00').padStart(2, '0'),
    minute: (map.minute ?? '00').padStart(2, '0'),
    second: (map.second ?? '00').padStart(2, '0'),
    monthShort,
    dayNumber: String(Number(map.day ?? '1')),
  };
}

function formatDateParts(
  parts: ReturnType<typeof getParts>,
  dateFormat: DateFormatValue,
): string {
  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return `${parts.month}/${parts.day}/${parts.year}`;
    case 'YYYY-MM-DD':
      return `${parts.year}-${parts.month}-${parts.day}`;
    case 'DD-MM-YYYY':
      return `${parts.day}-${parts.month}-${parts.year}`;
    case 'D MMM YYYY':
      return `${parts.dayNumber} ${parts.monthShort} ${parts.year}`;
    case 'DD/MM/YYYY':
    default:
      return `${parts.day}/${parts.month}/${parts.year}`;
  }
}

export function resolveLocale(locale?: Partial<DateTimeLocale> | null): DateTimeLocale {
  return normalizeLocale(locale);
}

export function formatDate(
  value: Date | string | number | null | undefined,
  locale?: Partial<DateTimeLocale> | null,
  fallback = '—',
): string {
  const date = toDate(value);
  if (!date) return fallback;
  const { timezone, dateFormat } = resolveLocale(locale);
  // For date-only strings, show calendar date without shifting by timezone.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split('-');
    return formatDateParts(
      {
        year,
        month,
        day,
        hour: '00',
        minute: '00',
        second: '00',
        monthShort: new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString('en-US', {
          month: 'short',
          timeZone: 'UTC',
        }),
        dayNumber: String(Number(day)),
      },
      dateFormat,
    );
  }
  return formatDateParts(getParts(date, timezone || DEFAULT_TIMEZONE), dateFormat);
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  locale?: Partial<DateTimeLocale> | null,
  fallback = '—',
): string {
  const date = toDate(value);
  if (!date) return fallback;
  const { timezone, dateFormat } = resolveLocale(locale);
  const parts = getParts(date, timezone || DEFAULT_TIMEZONE);
  return `${formatDateParts(parts, dateFormat)} ${parts.hour}:${parts.minute}`;
}

export function formatTime(
  value: Date | string | number | null | undefined,
  locale?: Partial<DateTimeLocale> | null,
  fallback = '—',
): string {
  const date = toDate(value);
  if (!date) return fallback;
  const { timezone } = resolveLocale(locale);
  const parts = getParts(date, timezone || DEFAULT_TIMEZONE);
  return `${parts.hour}:${parts.minute}`;
}

/** Live "now" label using tenant timezone + date format. */
export function formatNow(locale?: Partial<DateTimeLocale> | null): string {
  return formatDateTime(new Date(), locale);
}

export function formatNowDate(locale?: Partial<DateTimeLocale> | null): string {
  return formatDate(new Date(), resolveLocale(locale));
}

/** Calendar "today" as YYYY-MM-DD in the tenant timezone (not UTC). */
export function todayIsoInTimeZone(locale?: Partial<DateTimeLocale> | null): string {
  const { timezone } = resolveLocale(locale);
  const parts = getParts(new Date(), timezone || DEFAULT_TIMEZONE);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Placeholder text for date inputs based on tenant format. */
export function dateInputPlaceholder(locale?: Partial<DateTimeLocale> | null): string {
  const { dateFormat } = resolveLocale(locale);
  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return 'MM/DD/YYYY';
    case 'YYYY-MM-DD':
      return 'YYYY-MM-DD';
    case 'DD-MM-YYYY':
      return 'DD-MM-YYYY';
    case 'D MMM YYYY':
      return 'D MMM YYYY';
    case 'DD/MM/YYYY':
    default:
      return 'DD/MM/YYYY';
  }
}

/** Format an ISO YYYY-MM-DD value for display in a date input. */
export function formatIsoForInput(
  iso: string | null | undefined,
  locale?: Partial<DateTimeLocale> | null,
): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return '';
  return formatDate(iso.trim(), locale, '');
}

/**
 * Parse a user-typed date (tenant format or common variants) into YYYY-MM-DD.
 * Returns null when the text is not a valid calendar date.
 */
export function parseDateInput(
  raw: string,
  locale?: Partial<DateTimeLocale> | null,
): string | null {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    return toIsoDate(year, month, day);
  }

  const { dateFormat } = resolveLocale(locale);

  const named = text.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (named) {
    const day = Number(named[1]);
    const month = MONTH_NAME_TO_INDEX[named[2].toLowerCase()];
    const year = Number(named[3]);
    if (!month) return null;
    return toIsoDate(year, month, day);
  }

  const numeric = text.match(/^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})$/);
  if (!numeric) return null;

  const a = Number(numeric[1]);
  const b = Number(numeric[2]);
  const c = Number(numeric[3]);

  if (dateFormat === 'YYYY-MM-DD' || String(numeric[1]).length === 4) {
    return toIsoDate(a, b, c);
  }

  if (dateFormat === 'MM/DD/YYYY') {
    return toIsoDate(c < 100 ? 2000 + c : c, a, b);
  }

  // DD/MM/YYYY and DD-MM-YYYY (default)
  return toIsoDate(c < 100 ? 2000 + c : c, b, a);
}
