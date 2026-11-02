import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
} from 'react';
import { CalendarDays } from 'lucide-react';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import {
  dateInputPlaceholder,
  formatIsoForInput,
  parseDateInput,
} from '@/lib/datetime';
import { cn } from '@/lib/utils';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
>;

export interface DateInputProps extends NativeInputProps {
  label?: string;
  hint?: string;
  error?: string;
  /** ISO date `YYYY-MM-DD` (empty string allowed). */
  value?: string;
  /** Called with ISO `YYYY-MM-DD`, or `''` when cleared. */
  onChange?: (value: string) => void;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      id,
      value = '',
      onChange,
      onBlur,
      min,
      max,
      disabled,
      name,
      required,
      placeholder,
      ...props
    },
    _ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const { locale } = useTenantDateTime();
    const pickerRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState(() => formatIsoForInput(value, locale));
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
      setText(formatIsoForInput(value, locale));
      setLocalError(null);
    }, [value, locale.dateFormat, locale.timezone]);

    const commitText = (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setText('');
        setLocalError(null);
        onChange?.('');
        return;
      }

      const iso = parseDateInput(trimmed, locale);
      if (!iso) {
        setLocalError(`Use ${dateInputPlaceholder(locale)}`);
        return;
      }

      const minIso = min != null ? String(min) : '';
      const maxIso = max != null ? String(max) : '';
      if (minIso && iso < minIso) {
        setLocalError(`Date must be on or after ${formatIsoForInput(minIso, locale)}`);
        return;
      }
      if (maxIso && iso > maxIso) {
        setLocalError(`Date must be on or before ${formatIsoForInput(maxIso, locale)}`);
        return;
      }

      setLocalError(null);
      setText(formatIsoForInput(iso, locale));
      onChange?.(iso);
    };

    const openPicker = () => {
      const picker = pickerRef.current;
      if (!picker || disabled) return;
      try {
        if (typeof picker.showPicker === 'function') {
          picker.showPicker();
        } else {
          picker.click();
        }
      } catch {
        picker.click();
      }
    };

    const shownError = error || localError;

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-800">
            {label}
            {required ? <span className="text-danger-600"> *</span> : null}
          </label>
        ) : null}

        <div className="relative">
          <input
            {...props}
            id={inputId}
            name={name}
            disabled={disabled}
            required={required}
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder || dateInputPlaceholder(locale)}
            aria-invalid={Boolean(shownError)}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (localError) setLocalError(null);
            }}
            onBlur={(event) => {
              commitText(event.target.value);
              onBlur?.(event);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitText(text);
              }
            }}
            className={cn(
              'h-10 w-full rounded-xl border bg-white py-2 pl-3 pr-10 text-sm text-ink-900 transition',
              'placeholder:text-ink-400 hover:border-ink-300',
              'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500/40',
              'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
              shownError ? 'border-danger-600 focus:ring-danger-600/30' : 'border-ink-200',
              className,
            )}
          />

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Open calendar"
            onClick={openPicker}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-400 transition hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </button>

          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            min={min != null ? String(min) : undefined}
            max={max != null ? String(max) : undefined}
            value={value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''}
            onChange={(event) => {
              const next = event.target.value;
              setLocalError(null);
              setText(formatIsoForInput(next, locale));
              onChange?.(next);
            }}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />
        </div>

        {hint && !shownError ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
        {shownError ? <p className="mt-1 text-xs text-danger-600">{shownError}</p> : null}
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';
