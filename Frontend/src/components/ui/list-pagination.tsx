import { Button } from './button';

export function ListPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1 && total === undefined) return null;

  const from = total && limit ? Math.min((page - 1) * limit + 1, total) : null;
  const to = total && limit ? Math.min(page * limit, total) : null;

  return (
    <footer className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-ink-100 sm:flex-row sm:items-center sm:justify-between">
      <p
        className="text-[12px] text-ink-500"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {from !== null && to !== null && total !== undefined ? (
          <>
            Showing{' '}
            <span className="font-semibold text-ink-800">{from}</span>–
            <span className="font-semibold text-ink-800">{to}</span> of{' '}
            <span className="font-semibold text-ink-800">{total}</span>
          </>
        ) : (
          <>
            Page <span className="font-semibold text-ink-800">{page}</span> of{' '}
            <span className="font-semibold text-ink-800">{totalPages}</span>
          </>
        )}
      </p>
      {totalPages > 1 ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="transition active:scale-[0.98]"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="transition active:scale-[0.98]"
          >
            Next
          </Button>
        </div>
      ) : null}
    </footer>
  );
}
