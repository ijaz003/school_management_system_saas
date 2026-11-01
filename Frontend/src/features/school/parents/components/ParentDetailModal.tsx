import { useState } from 'react';
import { KeyRound, Link2, Unlink, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Modal, ModalSection } from '@/components/ui/modal';
import { PageLoader } from '@/components/ui/spinner';
import {
  useLinkStudents,
  useResetParentPassword,
  useUnlinkStudent,
  useUpdateParent,
  type ParentResetPasswordResponse,
} from '../hooks/useParentMutations';
import { useParent, type LinkedChild, type ParentRecord } from '../hooks/useParents';
import { StudentPicker } from './StudentPicker';

export function ParentDetailModal({
  parentId,
  initial,
  onClose,
  onPasswordReset,
}: {
  parentId: string;
  initial?: ParentRecord;
  onClose: () => void;
  onPasswordReset: (result: ParentResetPasswordResponse) => void;
}) {
  const parentQuery = useParent(parentId);
  const parent = parentQuery.data ?? initial;

  // `null` means the field is untouched and mirrors the server value.
  const [nameDraft, setFullName] = useState<string | null>(null);
  const [phoneDraft, setPhone] = useState<string | null>(null);
  const fullName = nameDraft ?? parent?.fullName ?? '';
  const phone = phoneDraft ?? parent?.phone ?? '';
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [toLink, setToLink] = useState<string[]>([]);
  const [pendingUnlink, setPendingUnlink] = useState<LinkedChild | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const updateParent = useUpdateParent(parentId);
  const linkStudents = useLinkStudents(parentId);
  const unlinkStudent = useUnlinkStudent(parentId);
  const resetPassword = useResetParentPassword();

  const saveProfile = () => {
    if (!parent) return;
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    setNameError('');
    setPhoneError('');
    if (trimmedName.length < 2) {
      setNameError('Enter the parent’s full name.');
      return;
    }
    if (trimmedPhone && (trimmedPhone.length < 7 || trimmedPhone.length > 20)) {
      setPhoneError('Phone must be 7–20 characters.');
      return;
    }
    updateParent.mutate(
      { fullName: trimmedName, phone: trimmedPhone || null },
      {
        onSuccess: () => {
          setFullName(null);
          setPhone(null);
        },
      },
    );
  };

  const dirty =
    parent !== undefined &&
    (fullName.trim() !== parent.fullName || (phone.trim() || null) !== (parent.phone ?? null));

  const linkSelected = () => {
    if (toLink.length === 0) return;
    linkStudents.mutate(toLink, { onSuccess: () => setToLink([]) });
  };

  return (
    <>
      <Modal
        title={parent?.fullName ?? 'Parent'}
        description={parent?.email}
        size="lg"
        onClose={onClose}
        footer={
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        }
      >
        {!parent ? (
          parentQuery.error ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-danger-600">{parentQuery.error.message}</p>
              <Button variant="outline" onClick={() => void parentQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <PageLoader compact />
          )
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={parent.isActive ? 'success' : 'neutral'}>
                {parent.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Reset password
                </Button>
                <Button
                  type="button"
                  variant={parent.isActive ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() =>
                    parent.isActive ? setConfirmToggle(true) : updateParent.mutate({ isActive: true })
                  }
                  isLoading={updateParent.isPending && !confirmToggle}
                >
                  {parent.isActive ? (
                    <>
                      <UserX className="h-3.5 w-3.5" aria-hidden="true" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" /> Activate
                    </>
                  )}
                </Button>
              </div>
            </div>

            <ModalSection className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-950">Profile</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="edit-parent-name"
                  label="Full name"
                  value={fullName}
                  error={nameError}
                  onChange={(event) => setFullName(event.target.value)}
                />
                <Input id="edit-parent-email" label="Email" value={parent.email} disabled readOnly />
                <Input
                  id="edit-parent-phone"
                  label="Phone"
                  type="tel"
                  value={phone}
                  error={phoneError}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={saveProfile}
                  disabled={!dirty}
                  isLoading={updateParent.isPending && !confirmToggle}
                >
                  Save changes
                </Button>
              </div>
            </ModalSection>

            <ModalSection className="space-y-3">
              <h3 className="text-sm font-semibold text-ink-950">
                Linked students ({parent.children.length})
              </h3>
              {parent.children.length === 0 ? (
                <p className="text-sm text-ink-500">No students linked yet.</p>
              ) : (
                <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
                  {parent.children.map((child) => (
                    <li key={child.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-950">{child.fullName}</p>
                        <p className="truncate text-xs text-ink-500">
                          {child.admissionNo} · {child.className} {child.sectionName}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingUnlink(child)}
                        aria-label={`Unlink ${child.fullName}`}
                      >
                        <Unlink className="h-3.5 w-3.5" aria-hidden="true" /> Unlink
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ModalSection>

            <ModalSection className="space-y-3">
              <h3 className="text-sm font-semibold text-ink-950">Link more students</h3>
              <StudentPicker
                value={toLink}
                onChange={setToLink}
                excludeIds={parent.children.map((child) => child.id)}
                disabled={linkStudents.isPending}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={linkSelected}
                  disabled={toLink.length === 0}
                  isLoading={linkStudents.isPending}
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Link selected
                </Button>
              </div>
            </ModalSection>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingUnlink)}
        title="Unlink student?"
        description={
          pendingUnlink && parent
            ? `${parent.fullName} will no longer see ${pendingUnlink.fullName} in the parent portal.`
            : ''
        }
        confirmLabel="Unlink"
        loading={unlinkStudent.isPending}
        onClose={() => setPendingUnlink(null)}
        onConfirm={() => {
          if (!pendingUnlink) return;
          unlinkStudent.mutate(pendingUnlink.id, { onSettled: () => setPendingUnlink(null) });
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset password?"
        description={
          parent ? `Generate a new temporary password for ${parent.fullName}.` : ''
        }
        confirmLabel="Reset password"
        variant="default"
        loading={resetPassword.isPending}
        onClose={() => setConfirmReset(false)}
        onConfirm={() =>
          resetPassword.mutate(parentId, {
            onSuccess: (result) => {
              setConfirmReset(false);
              onPasswordReset(result);
            },
            onError: () => setConfirmReset(false),
          })
        }
      />

      <ConfirmDialog
        open={confirmToggle}
        title="Deactivate parent?"
        description={
          parent ? `${parent.fullName} will no longer be able to sign in to the parent portal.` : ''
        }
        confirmLabel="Deactivate"
        loading={updateParent.isPending}
        onClose={() => setConfirmToggle(false)}
        onConfirm={() =>
          updateParent.mutate({ isActive: false }, { onSettled: () => setConfirmToggle(false) })
        }
      />
    </>
  );
}
