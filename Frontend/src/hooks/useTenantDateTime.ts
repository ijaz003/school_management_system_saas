import { useMemo } from 'react';
import {
  formatDate,
  formatDateTime,
  formatNow,
  formatNowDate,
  formatTime,
  resolveLocale,
  todayIsoInTimeZone,
  type DateTimeLocale,
} from '@/lib/datetime';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';

export function useTenantLocale(): DateTimeLocale {
  const user = useAppSelector(selectUser);
  return useMemo(
    () =>
      resolveLocale({
        timezone: user?.tenantLocale?.timezone,
        dateFormat: user?.tenantLocale?.dateFormat as DateTimeLocale['dateFormat'] | undefined,
      }),
    [user?.tenantLocale?.dateFormat, user?.tenantLocale?.timezone],
  );
}

export function useTenantDateTime() {
  const locale = useTenantLocale();

  return useMemo(
    () => ({
      locale,
      timezone: locale.timezone,
      dateFormat: locale.dateFormat,
      formatDate: (value: Date | string | number | null | undefined, fallback?: string) =>
        formatDate(value, locale, fallback),
      formatDateTime: (value: Date | string | number | null | undefined, fallback?: string) =>
        formatDateTime(value, locale, fallback),
      formatTime: (value: Date | string | number | null | undefined, fallback?: string) =>
        formatTime(value, locale, fallback),
      formatNow: () => formatNow(locale),
      formatNowDate: () => formatNowDate(locale),
      todayIso: () => todayIsoInTimeZone(locale),
    }),
    [locale],
  );
}
