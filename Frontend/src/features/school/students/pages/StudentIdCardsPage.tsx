import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { ArrowLeft, Printer } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { usePermission } from '@/hooks/usePermission';
import { api, buildQueryString } from '@/lib/api';

interface IdCard {
  id: string;
  fullName: string;
  admissionNo: string;
  cardCode: string;
  gender: string;
  dateOfBirth: string;
  className: string;
  sectionName: string;
  guardianName: string;
}

function useQrDataUrl(value: string) {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(value, {
      margin: 1,
      width: 160,
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);
  return src;
}

function IdCardSheet({
  school,
  card,
}: {
  school: { name: string; city: string | null; address: string | null };
  card: IdCard;
}) {
  const qr = useQrDataUrl(card.cardCode);
  return (
    <article className="panel w-full max-w-sm overflow-hidden p-4 print:break-inside-avoid print:border print:border-ink-300 print:shadow-none">
      <header className="border-b border-ink-200 pb-3 text-center">
        <p className="font-display text-lg font-semibold text-ink-950">{school.name}</p>
        {(school.city || school.address) && (
          <p className="mt-0.5 text-[0.7rem] text-ink-500">
            {[school.address, school.city].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary-700">
          Student ID card
        </p>
      </header>
      <div className="mt-4 flex gap-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-ink-950">{card.fullName}</p>
          <p className="mt-1 font-mono text-xs text-ink-600">{card.admissionNo}</p>
          <p className="mt-2 text-ink-600">
            {card.className} · {card.sectionName}
          </p>
          <p className="capitalize text-ink-500">
            {card.gender} · {card.dateOfBirth}
          </p>
          <p className="mt-2 text-xs text-ink-500">Guardian: {card.guardianName}</p>
        </div>
        <div className="shrink-0 text-center">
          {qr ? (
            <img src={qr} alt={`QR for ${card.fullName}`} className="h-28 w-28 rounded-lg bg-white" />
          ) : (
            <div className="h-28 w-28 animate-pulse rounded-lg bg-ink-100" />
          )}
          <p className="mt-1 font-mono text-[0.65rem] text-ink-500">{card.cardCode}</p>
        </div>
      </div>
    </article>
  );
}

export function StudentIdCardsPage() {
  const { can } = usePermission();
  const canView = can('students.read');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const classesQuery = useClasses();
  const sectionsQuery = useSections(classId);

  const cardsQuery = useQuery({
    queryKey: ['students', 'id-cards', classId, sectionId],
    enabled: canView,
    queryFn: async () => {
      const response = await api.get<{
        school: {
          name: string;
          city: string | null;
          address: string | null;
          logoUrl: string | null;
        };
        cards: IdCard[];
      }>(
        `/school/students/id-cards${buildQueryString({
          classId: classId || undefined,
          sectionId: sectionId || undefined,
        })}`,
      );
      if (!response.data) throw new Error('ID cards unavailable');
      return response.data;
    },
  });

  if (!canView) {
    return (
      <AppLayout>
        <EmptyState title="No access" description="You need students.read to print ID cards." />
      </AppLayout>
    );
  }

  const cards = cardsQuery.data?.cards ?? [];
  const school = cardsQuery.data?.school;

  return (
    <AppLayout>
      <div className="space-y-6 print:space-y-0">
        <div className="print:hidden">
          <Link
            to="/students"
            className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to students
          </Link>
          <PageHeader
            eyebrow="Students"
            title="ID cards"
            description="Print QR cards for the optional card-scan attendance station."
            actions={
              <Button
                type="button"
                variant="outline"
                disabled={cards.length === 0}
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" aria-hidden="true" /> Print
              </Button>
            }
          />
        </div>

        <section className="panel grid gap-3 p-4 sm:grid-cols-2 print:hidden">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">Class</span>
            <select
              className="field-select"
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSectionId('');
              }}
            >
              <option value="">All classes</option>
              {(classesQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">Section</span>
            <select
              className="field-select"
              value={sectionId}
              disabled={!classId}
              onChange={(event) => setSectionId(event.target.value)}
            >
              <option value="">All sections</option>
              {(sectionsQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {cardsQuery.isPending ? (
          <div className="panel">
            <PageLoader compact />
          </div>
        ) : cardsQuery.error ? (
          <div className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-sm text-danger-700">
            {cardsQuery.error.message}
          </div>
        ) : cards.length === 0 || !school ? (
          <EmptyState title="No students" description="No active students match these filters." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-2">
            {cards.map((card) => (
              <IdCardSheet key={card.id} school={school} card={card} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
