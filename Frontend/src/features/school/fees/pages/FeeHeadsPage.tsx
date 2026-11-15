import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageShell } from '@/components/ui/page-shell';
import { RowActions } from '@/components/ui/row-actions';
import { PageLoader } from '@/components/ui/spinner';
import { usePermission } from '@/hooks/usePermission';
import {
  useCreateFeeHead,
  useDeleteFeeHead,
  useFeeHeads,
  useUpdateFeeHead,
} from '../hooks/useFees';
import type { FeeHead, FeeHeadType } from '../hooks/keys';

export function FeeHeadsPage() {
  const { can } = usePermission();
  const canEdit = can('settings.feeheads.edit');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FeeHead | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FeeHead | null>(null);

  const query = useFeeHeads({ search: search || undefined });
  const deleteHead = useDeleteFeeHead();
  const items = query.data ?? [];

  return (
    <AppLayout>
      <PageShell
        eyebrow="Finance"
        title="Fee Heads"
        description="Manage fee categories such as tuition, transport, and library."
        actions={
          canEdit ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add fee head
            </Button>
          ) : undefined
        }
      >
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search fee heads"
              placeholder="Search by name or code..."
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {query.isPending ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <PageLoader compact />
          </div>
        ) : query.error ? (
          <section className="rounded-2xl border border-danger-100 bg-white p-8 text-center">
            <p className="text-sm text-danger-700">{query.error.message}</p>
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No fee heads yet"
            description="Create fee categories to organize your fee structures."
            action={
              canEdit ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add fee head
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge tone="primary" className="capitalize">
                      {item.type.replace('_', ' ')}
                    </Badge>
                    <Badge tone={item.isActive ? 'success' : 'neutral'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {item.isMandatory && <Badge tone="warning">Mandatory</Badge>}
                  </div>
                  <h2 className="font-display text-lg font-semibold text-ink-950">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-600">
                    Code: <code className="rounded bg-ink-100 px-1.5 py-0.5">{item.code}</code>
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                </div>
                <RowActions
                  onEdit={canEdit ? () => setEditing(item) : undefined}
                  onDelete={canEdit ? () => setPendingDelete(item) : undefined}
                />
              </article>
            ))}
          </div>
        )}
      </PageShell>

      {creating && <FeeHeadModal onClose={() => setCreating(false)} />}
      {editing && (
        <FeeHeadModal feeHead={editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete fee head?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be archived. Fee heads used by a fee structure cannot be deleted.`
            : ''
        }
        confirmLabel="Delete fee head"
        loading={deleteHead.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteHead.mutate(pendingDelete.id, {
            onSuccess: () => setPendingDelete(null),
          });
        }}
      />
    </AppLayout>
  );
}

function FeeHeadModal({
  feeHead,
  onClose,
}: {
  feeHead?: FeeHead;
  onClose: () => void;
}) {
  const create = useCreateFeeHead();
  const update = useUpdateFeeHead();
  const isEdit = Boolean(feeHead);
  const [name, setName] = useState(feeHead?.name ?? '');
  const [code, setCode] = useState(feeHead?.code ?? '');
  const [autoCode, setAutoCode] = useState(!feeHead);
  const [type, setType] = useState<FeeHeadType>(feeHead?.type ?? 'monthly');
  const [description, setDescription] = useState(feeHead?.description ?? '');
  const [isMandatory, setIsMandatory] = useState(feeHead?.isMandatory ?? true);
  const [isActive, setIsActive] = useState(feeHead?.isActive ?? true);
  const isPending = create.isPending || update.isPending;

  const submit = () => {
    if (name.trim().length < 2 || code.trim().length < 2) return;
    const data = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      description: description.trim() || undefined,
      isMandatory,
      ...(isEdit ? { isActive } : {}),
    };

    if (feeHead) {
      update.mutate({ id: feeHead.id, ...data }, { onSuccess: onClose });
    } else {
      create.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={feeHead ? 'Edit fee head' : 'New fee head'}
      description="Define a fee category for your school."
      size="lg"
      closeDisabled={isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={isPending}>
            {feeHead ? 'Save changes' : 'Create fee head'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          id="fee-head-name"
          label="Name"
          required
          value={name}
          onChange={(event) => {
            const value = event.target.value;
            setName(value);
            if (autoCode && !feeHead) {
              setCode(
                value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]+/g, '_')
                  .replace(/^_|_$/g, '')
                  .slice(0, 30),
              );
            }
          }}
          placeholder="e.g. Tuition Fee"
        />
        <Input
          id="fee-head-code"
          label="Code"
          required
          value={code}
          onChange={(event) => {
            setAutoCode(false);
            setCode(event.target.value.toUpperCase());
          }}
          disabled={Boolean(feeHead)}
          hint="Use uppercase letters, numbers, and underscores."
          placeholder="e.g. TUITION"
        />
        <div>
          <label
            htmlFor="fee-head-type"
            className="mb-1.5 block text-sm font-medium text-ink-800"
          >
            Type
          </label>
          <select
            id="fee-head-type"
            className="field-select"
            value={type}
            onChange={(event) => setType(event.target.value as FeeHeadType)}
          >
            <option value="monthly">Monthly</option>
            <option value="term">Term</option>
            <option value="annual">Annual</option>
            <option value="one_time">One-time</option>
          </select>
        </div>
        <Input
          id="fee-head-description"
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="space-y-3 rounded-lg bg-ink-50 p-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(event) => setIsMandatory(event.target.checked)}
            />
            Mandatory for all students
          </label>
          {feeHead && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active
            </label>
          )}
        </div>
      </div>
    </Modal>
  );
}
