import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  ScanLine,
  CalendarDays,
  AlertTriangle,
  Check,
  CopyX,
  CircleDot,
  Keyboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { usePermission } from '@/hooks/usePermission';
import { useTenantDateTime } from '@/hooks/useTenantDateTime';
import { api } from '@/lib/api';

interface ScanResult {
  alreadyMarked: boolean;
  created: boolean;
  date: string;
  status: string;
  scannedAt: string;
  student: {
    id: string;
    fullName: string;
    admissionNo: string;
    cardCode: string;
    className: string;
    sectionName: string;
  };
}

const CAMERA_REGION_ID = 'attendance-qr-reader';

export function AttendanceScanPage() {
  const { can } = usePermission();
  const canMark = can('attendance.mark');
  const { todayIso, formatTime } = useTenantDateTime();

  const configQuery = useQuery({
    queryKey: ['attendance', 'scan-config'],
    enabled: canMark,
    queryFn: async () => {
      const response = await api.get<{ cardAttendanceEnabled: boolean }>(
        '/school/attendance/scan-config',
      );
      if (!response.data) throw new Error('Scan config unavailable');
      return response.data;
    },
  });
  const enabled = Boolean(configQuery.data?.cardAttendanceEnabled);

  const [code, setCode] = useState('');
  const [date, setDate] = useState(() => todayIso());
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const dateRef = useRef(date);
  const busyRef = useRef(false);
  const lastScannedRef = useRef<{ code: string; at: number } | null>(null);

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const scanMutation = useMutation({
    mutationFn: async (payload: { code: string; date: string }) => {
      const response = await api.post<ScanResult>('/school/attendance/scan', payload);
      if (!response.data) throw new Error('Scan failed');
      return response.data;
    },
    onSuccess: (result) => {
      setLastResult(result);
      setHistory((current) => [result, ...current].slice(0, 20));
      if (result.alreadyMarked) {
        toast.message(`${result.student.fullName} already marked today`);
      } else {
        toast.success(`${result.student.fullName} → ${result.status}`);
      }
      setCode('');
      inputRef.current?.focus();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setCode('');
      inputRef.current?.focus();
    },
    onSettled: () => {
      window.setTimeout(() => {
        busyRef.current = false;
      }, 1500);
    },
  });

  const submitCode = useCallback(
    (raw: string) => {
      const value = raw.trim().toUpperCase();
      if (!value || !enabled) return;

      const now = Date.now();
      const last = lastScannedRef.current;
      if (last && last.code === value && now - last.at < 2500) return;
      if (busyRef.current || scanMutation.isPending) return;

      busyRef.current = true;
      lastScannedRef.current = { code: value, at: now };
      scanMutation.mutate({ code: value, date: dateRef.current });
    },
    [enabled, scanMutation],
  );

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      setCameraOn(false);
      return;
    }
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* ignore */
    }
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!enabled) {
      toast.error('Enable card attendance in School Settings first');
      return;
    }
    setCameraError(null);
    await stopCamera();

    try {
      const scanner = new Html5Qrcode(CAMERA_REGION_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (decoded) => submitCode(decoded),
        () => {},
      );
      setCameraOn(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not open camera. Allow camera permission and try again.';
      setCameraError(message);
      setCameraOn(false);
      scannerRef.current = null;
      toast.error(message);
    }
  }, [enabled, stopCamera, submitCode]);

  useEffect(() => {
    if (enabled && canMark && !cameraOn) inputRef.current?.focus();
  }, [enabled, canMark, cameraOn]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  if (!canMark) {
    return (
      <AppLayout>
        <div className="mx-auto flex max-w-xl flex-col items-center py-20">
          <EmptyState
            title="No access"
            description="You need attendance.mark permission to use the scan station."
          />
        </div>
      </AppLayout>
    );
  }

  const cameraStatus: 'off' | 'scanning' | 'error' = cameraError
    ? 'error'
    : cameraOn
      ? 'scanning'
      : 'off';

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        {/* ---------- Header ---------- */}
        <div className="space-y-3">
          <Link
            to="/attendance"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px] font-medium text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to attendance
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-white via-white to-ink-50/60 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-100/40 blur-3xl"
            />
            <div className="relative">
              <PageHeader
                eyebrow="Attendance"
                title="Card scan station"
                description="Scan student ID QR cards with the webcam, or use a USB barcode scanner / typed code."
              />
            </div>
          </div>
        </div>

        {/* ---------- Warning banner ---------- */}
        {!configQuery.isPending && !enabled && (
          <div className="flex items-start gap-3 rounded-2xl border border-warning-100 bg-gradient-to-br from-warning-50 to-white p-4 shadow-sm sm:p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-700">
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 text-[13px] leading-relaxed text-warning-900">
              <p className="font-semibold">Card attendance is turned off</p>
              <p className="mt-0.5 text-warning-800/90">
                Enable it in{' '}
                <Link
                  to="/settings"
                  className="font-semibold text-warning-900 underline decoration-warning-400 underline-offset-2 hover:decoration-warning-600"
                >
                  School Settings
                </Link>{' '}
                to start scanning.
              </p>
            </div>
          </div>
        )}

        {/* ---------- Main grid ---------- */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* ========== Camera panel ========== */}
          <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-gradient-to-r from-ink-50/60 to-transparent px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-700 ring-1 ring-ink-100">
                  <Camera className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-[14px] font-semibold tracking-tight text-ink-950">
                    Webcam scanner
                  </h2>
                  <StatusPill status={cameraStatus} />
                </div>
              </div>

              {cameraOn ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void stopCamera()}
                  className="transition active:scale-[0.98]"
                >
                  <CameraOff className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Stop camera
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={!enabled}
                  onClick={() => void startCamera()}
                  className="transition active:scale-[0.98]"
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Start camera
                </Button>
              )}
            </div>

            <div className="p-5">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-ink-950 ring-1 ring-inset ring-white/10">
                <div
                  id={CAMERA_REGION_ID}
                  className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                />

                {/* Scan frame overlay */}
                {cameraOn && (
                  <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-black/0" />
                    {/* corner brackets */}
                    <Corner className="left-8 top-8 border-l-2 border-t-2" />
                    <Corner className="right-8 top-8 border-r-2 border-t-2" />
                    <Corner className="bottom-8 left-8 border-b-2 border-l-2" />
                    <Corner className="bottom-8 right-8 border-b-2 border-r-2" />
                    {/* scan line */}
                    <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary-400 to-transparent shadow-[0_0_12px_2px_rgba(99,102,241,0.45)] animate-[scanline_2.4s_ease-in-out_infinite]" />
                  </div>
                )}

                {/* Off state */}
                {!cameraOn && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-ink-300 ring-1 ring-white/10">
                      <Camera className="h-6 w-6" aria-hidden />
                    </span>
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium text-ink-200">
                        Camera is off
                      </p>
                      <p className="max-w-[220px] text-[11.5px] leading-relaxed text-ink-400">
                        Click <span className="text-ink-200">Start camera</span> and
                        allow permission to scan QR cards.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {cameraError && !cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-rose-950/40 px-6 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30">
                      <AlertTriangle className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-[12.5px] font-medium text-rose-100">
                      Camera error
                    </p>
                    <p className="max-w-[260px] text-[11px] leading-relaxed text-rose-200/80">
                      {cameraError}
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-500">
                <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-ink-400" aria-hidden />
                Hold the printed ID card QR clearly in the frame. Each successful scan
                marks <span className="font-medium text-ink-700">present</span> for the
                selected date.
              </p>
            </div>
          </section>

          {/* ========== Right column (result + manual entry) ========== */}
          <div className="space-y-6">
            {/* Result card */}
            <section
              aria-live="polite"
              aria-atomic="true"
              className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm"
            >
              <div className="border-b border-ink-100 bg-gradient-to-r from-ink-50/60 to-transparent px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-700 ring-1 ring-ink-100">
                    <ScanLine className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-[14px] font-semibold tracking-tight text-ink-950">
                      Scan result
                    </h2>
                    <p className="text-[11px] text-ink-500">
                      Latest scan appears here.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {lastResult ? (
                  <ResultCard result={lastResult} />
                ) : (
                  <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-400 ring-1 ring-ink-100">
                      <ScanLine className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-[12.5px] font-medium text-ink-700">
                        Waiting for scan…
                      </p>
                      <p className="text-[11px] text-ink-500">
                        Scan a card or type a code below.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Manual entry */}
            <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
              <div className="border-b border-ink-100 bg-gradient-to-r from-ink-50/60 to-transparent px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-700 ring-1 ring-ink-100">
                    <Keyboard className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-[14px] font-semibold tracking-tight text-ink-950">
                      Manual entry
                    </h2>
                    <p className="text-[11px] text-ink-500">
                      Type a code or use a USB barcode scanner.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <label
                    htmlFor="attendance-date"
                    className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                    Attendance date
                  </label>
                  <DateInput
                    id="attendance-date"
                    className="max-w-xs text-[13px]"
                    value={date}
                    onChange={setDate}
                  />
                </div>

                <div>
                  <label
                    htmlFor="attendance-code"
                    className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500"
                  >
                    <ScanLine className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                    Card / admission code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="attendance-code"
                      ref={inputRef}
                      className="field-select min-w-0 flex-1 font-mono text-[15px] tracking-wider uppercase"
                      placeholder="Scan or type code, press Enter"
                      value={code}
                      disabled={!enabled || scanMutation.isPending}
                      onChange={(event) => setCode(event.target.value.toUpperCase())}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        submitCode(code);
                      }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <Button
                      type="button"
                      disabled={!enabled || !code.trim() || scanMutation.isPending}
                      isLoading={scanMutation.isPending}
                      onClick={() => submitCode(code)}
                      className="shrink-0 transition active:scale-[0.98]"
                    >
                      {!scanMutation.isPending && (
                        <ScanLine className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      )}
                      Mark
                    </Button>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-500">
                    <Keyboard className="h-3 w-3 text-ink-400" aria-hidden />
                    USB scanners work automatically — they type the code plus Enter.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ---------- History ---------- */}
        {history.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-gradient-to-r from-ink-50/60 to-transparent px-5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[14px] font-semibold tracking-tight text-ink-950">
                  Recent scans
                </h2>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10.5px] font-medium tabular-nums text-ink-600">
                  {history.length}
                </span>
              </div>
              <span className="text-[11px] text-ink-400">Last 20 in this session</span>
            </div>
            <ul className="divide-y divide-ink-100/80">
              {history.map((item, index) => (
                <li
                  key={`${item.student.id}-${item.scannedAt}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-ink-50/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold ${
                        item.alreadyMarked
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                      }`}
                      aria-hidden
                    >
                      {item.alreadyMarked ? (
                        <CopyX className="h-3.5 w-3.5" />
                      ) : (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink-950">
                        {item.student.fullName}
                      </p>
                      <p className="truncate text-[11.5px] text-ink-500">
                        {item.student.className} · {item.student.sectionName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={item.alreadyMarked ? 'warning' : 'success'}
                      className="rounded-md px-2 py-0.5 text-[10.5px] font-medium tracking-tight"
                    >
                      {item.alreadyMarked ? 'Duplicate' : item.status}
                    </Badge>
                    <span className="text-[11px] tabular-nums text-ink-400">
                      {formatTime(item.scannedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* footer note */}
        <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-ink-400">
          <CircleDot className="h-3.5 w-3.5" aria-hidden />
          <span>All scans are logged with your account and timestamp.</span>
        </div>
      </div>
    </AppLayout>
  );
}

/* ---------- sub-components ---------- */

function StatusPill({ status }: { status: 'off' | 'scanning' | 'error' }) {
  const map = {
    off: {
      dot: 'bg-ink-400',
      text: 'text-ink-500',
      label: 'Camera off',
      pulse: false,
    },
    scanning: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
      label: 'Scanning',
      pulse: true,
    },
    error: {
      dot: 'bg-rose-500',
      text: 'text-rose-700',
      label: 'Error',
      pulse: false,
    },
  } as const;
  const s = map[status];
  return (
    <span
      className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium ${s.text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {s.pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-70`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`} />
      </span>
      {s.label}
    </span>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      className={`absolute h-6 w-6 rounded-sm border-primary-300/90 ${className}`}
    />
  );
}

function ResultCard({ result }: { result: ScanResult }) {
  const { formatDateTime } = useTenantDateTime();
  const tone = result.alreadyMarked
    ? {
        wrap: 'bg-gradient-to-br from-amber-50 to-white ring-amber-100',
        icon: 'bg-amber-100 text-amber-700 ring-amber-200',
        title: 'text-ink-950',
      }
    : {
        wrap: 'bg-gradient-to-br from-emerald-50 to-white ring-emerald-100',
        icon: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        title: 'text-ink-950',
      };

  return (
    <div
      className={`animate-[fadeIn_240ms_ease-out] space-y-3 rounded-xl p-4 ring-1 ring-inset ${tone.wrap}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 ${tone.icon}`}
            aria-hidden
          >
            {result.alreadyMarked ? (
              <CopyX className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" strokeWidth={3} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              {result.alreadyMarked ? 'Duplicate scan' : 'Marked present'}
            </p>
            <p className={`truncate font-display text-[15px] font-semibold tracking-tight ${tone.title}`}>
              {result.student.fullName}
            </p>
          </div>
        </div>
        <Badge
          tone={result.alreadyMarked ? 'warning' : 'success'}
          className="shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-medium capitalize tracking-tight"
        >
          {result.status}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip>{result.student.admissionNo}</Chip>
        <Chip>{result.student.className}</Chip>
        <Chip>{result.student.sectionName}</Chip>
      </div>

      <p className="flex items-center gap-1 text-[11px] text-ink-500">
        <CalendarDays className="h-3 w-3 text-ink-400" aria-hidden />
        <span className="tabular-nums">
          {formatDateTime(result.scannedAt)}
        </span>
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-ink-700 ring-1 ring-inset ring-ink-100">
      {children}
    </span>
  );
}