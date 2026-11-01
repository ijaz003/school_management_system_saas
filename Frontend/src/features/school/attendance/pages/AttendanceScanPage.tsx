import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { usePermission } from '@/hooks/usePermission';
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

export function AttendanceScanPage() {
  const { can } = usePermission();
  const canMark = can('attendance.mark');
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
  });

  useEffect(() => {
    if (enabled && canMark) inputRef.current?.focus();
  }, [enabled, canMark]);

  if (!canMark) {
    return (
      <AppLayout>
        <EmptyState
          title="No access"
          description="You need attendance.mark permission to use the scan station."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link
            to="/attendance"
            className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to attendance
          </Link>
          <PageHeader
            eyebrow="Attendance"
            title="Card scan station"
            description="Plug in a USB barcode/QR scanner (keyboard wedge). Scan student cards to mark present."
          />
        </div>

        {!configQuery.isPending && !enabled && (
          <section className="rounded-2xl border border-warning-100 bg-warning-50 p-5 text-sm text-warning-900">
            Card attendance is turned off.{' '}
            <Link to="/settings" className="font-semibold underline">
              Enable it in School Settings
            </Link>{' '}
            first.
          </section>
        )}

        <section className="panel grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink-800">Attendance date</span>
              <input
                type="date"
                className="field-select max-w-xs"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink-800">Scan code</span>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  className="field-select font-mono text-lg tracking-wide"
                  placeholder="Scan or type card / admission no, then Enter"
                  value={code}
                  disabled={!enabled || scanMutation.isPending}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    const value = code.trim();
                    if (!value || !enabled) return;
                    scanMutation.mutate({ code: value, date });
                  }}
                  autoComplete="off"
                  autoFocus
                />
                <Button
                  type="button"
                  disabled={!enabled || !code.trim() || scanMutation.isPending}
                  isLoading={scanMutation.isPending}
                  onClick={() => {
                    const value = code.trim();
                    if (!value) return;
                    scanMutation.mutate({ code: value, date });
                  }}
                >
                  <ScanLine className="h-4 w-4" aria-hidden="true" /> Mark
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-500">
                Most USB scanners type the code and send Enter automatically.
              </p>
            </label>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
            {lastResult ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={lastResult.alreadyMarked ? 'warning' : 'success'}>
                    {lastResult.alreadyMarked ? 'Already marked' : 'Marked'}
                  </Badge>
                  <Badge tone="primary">{lastResult.status}</Badge>
                </div>
                <p className="font-display text-2xl font-semibold text-ink-950">
                  {lastResult.student.fullName}
                </p>
                <p className="text-sm text-ink-600">
                  {lastResult.student.admissionNo} · {lastResult.student.className} ·{' '}
                  {lastResult.student.sectionName}
                </p>
                <p className="text-xs text-ink-400">
                  {new Date(lastResult.scannedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-ink-500">
                <ScanLine className="mb-3 h-10 w-10 text-ink-300" aria-hidden="true" />
                <p className="text-sm">Waiting for scan…</p>
              </div>
            )}
          </div>
        </section>

        {history.length > 0 && (
          <section className="panel overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3">
              <h2 className="font-semibold text-ink-950">Recent scans</h2>
            </div>
            <ul className="divide-y divide-ink-100">
              {history.map((item, index) => (
                <li
                  key={`${item.student.id}-${item.scannedAt}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink-950">{item.student.fullName}</p>
                    <p className="text-ink-500">
                      {item.student.className} · {item.student.sectionName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={item.alreadyMarked ? 'warning' : 'success'}>
                      {item.alreadyMarked ? 'Duplicate' : item.status}
                    </Badge>
                    <span className="text-xs text-ink-400">
                      {new Date(item.scannedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
