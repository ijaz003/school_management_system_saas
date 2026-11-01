import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useCreateParent, type CreateParentResponse } from '../hooks/useParentMutations';
import { StudentPicker } from './StudentPicker';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateParentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (result: CreateParentResponse) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; phone?: string }>({});
  const createParent = useCreateParent();

  const submit = () => {
    const next: typeof errors = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter the parent’s full name.';
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    const trimmedPhone = phone.trim();
    if (trimmedPhone && (trimmedPhone.length < 7 || trimmedPhone.length > 20)) {
      next.phone = 'Phone must be 7–20 characters.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    createParent.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim(),
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
        ...(studentIds.length > 0 ? { studentIds } : {}),
      },
      { onSuccess: onCreated },
    );
  };

  return (
    <Modal
      title="Add parent"
      description="Create a parent portal account and optionally link students."
      size="lg"
      onClose={onClose}
      closeDisabled={createParent.isPending}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createParent.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={createParent.isPending}>
            Create parent
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="parent-name"
            label="Full name"
            required
            value={fullName}
            error={errors.fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Input
            id="parent-email"
            label="Email"
            type="email"
            required
            value={email}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            id="parent-phone"
            label="Phone"
            type="tel"
            value={phone}
            error={errors.phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">Link students (optional)</p>
          <StudentPicker value={studentIds} onChange={setStudentIds} />
        </div>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
