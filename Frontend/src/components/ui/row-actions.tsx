import {
  Eye,
  KeyRound,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconActionTone = 'neutral' | 'primary' | 'warning' | 'danger';

const toneClass: Record<IconActionTone, string> = {
  neutral: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  primary: 'text-primary-700 hover:bg-primary-50',
  warning: 'text-warning-700 hover:bg-warning-50',
  danger: 'text-danger-600 hover:bg-danger-50',
};

/** Compact icon-only action used in table/list rows (Staff-style). */
export function IconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone = 'neutral',
  className,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  tone?: IconActionTone;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-40',
        toneClass[tone],
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/**
 * Standard row actions: Preview · Edit · (optional Reset) · Delete.
 * Pass only the handlers you need; missing handlers hide that button.
 */
export function RowActions({
  onPreview,
  onEdit,
  onDelete,
  onResetPassword,
  previewLabel = 'Preview',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  resetPasswordLabel = 'Reset password',
  disabled,
  className,
}: {
  onPreview?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onResetPassword?: () => void;
  previewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  resetPasswordLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  if (!onPreview && !onEdit && !onDelete && !onResetPassword) return null;

  return (
    <div className={cn('flex items-center justify-end gap-0.5', className)}>
      {onPreview ? (
        <IconAction label={previewLabel} icon={Eye} onClick={onPreview} disabled={disabled} />
      ) : null}
      {onEdit ? (
        <IconAction label={editLabel} icon={Pencil} onClick={onEdit} disabled={disabled} />
      ) : null}
      {onResetPassword ? (
        <IconAction
          label={resetPasswordLabel}
          icon={KeyRound}
          onClick={onResetPassword}
          disabled={disabled}
          tone="warning"
        />
      ) : null}
      {onDelete ? (
        <IconAction
          label={deleteLabel}
          icon={Trash2}
          onClick={onDelete}
          disabled={disabled}
          tone="danger"
        />
      ) : null}
    </div>
  );
}
