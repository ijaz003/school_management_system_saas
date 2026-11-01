import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function TempPasswordModal({
  email,
  tempPassword,
  title = 'Temporary password',
  onClose,
}: {
  email: string;
  tempPassword: string;
  title?: string;
  onClose: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success('Temporary password copied');
    } catch {
      toast.error('Could not copy the password. Select and copy it manually.');
    }
  };

  return (
    <Modal
      title={title}
      description={`Login credentials for ${email}`}
      size="sm"
      onClose={onClose}
      closeOnOverlay={false}
      footer={<Button onClick={onClose}>I have saved it</Button>}
    >
      <div className="space-y-3">
        <p className="text-sm text-warning-700">
          This password is shown only once. Share it securely with the parent — they should change
          it after signing in.
        </p>
        <div className="flex flex-wrap gap-2">
          <code className="min-w-0 flex-1 break-all rounded-xl border border-warning-100 bg-warning-50 px-3 py-2 font-mono text-sm text-ink-900">
            {tempPassword}
          </code>
          <Button type="button" variant="outline" onClick={() => void copy()}>
            <Copy className="h-4 w-4" aria-hidden="true" /> Copy
          </Button>
        </div>
      </div>
    </Modal>
  );
}
