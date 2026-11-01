import { Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ParentRecord } from '../hooks/useParents';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ParentTable({
  items,
  onManage,
}: {
  items: ParentRecord[];
  onManage: (parent: ParentRecord) => void;
}) {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-ink-100 bg-surface-muted/90 text-xs uppercase tracking-wide text-ink-500 backdrop-blur">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Parent</th>
              <th className="px-5 py-3.5 font-semibold">Contact</th>
              <th className="px-5 py-3.5 font-semibold">Students</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((parent) => (
              <tr key={parent.id} className="group transition hover:bg-primary-50/30">
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left"
                    onClick={() => onManage(parent)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">
                      {initials(parent.fullName)}
                    </span>
                    <span className="font-semibold text-ink-950 group-hover:text-primary-800">
                      {parent.fullName}
                    </span>
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-1.5 text-ink-900">
                    <Mail className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    {parent.email}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                    <Phone className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    {parent.phone || '—'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {parent.children.length === 0 ? (
                    <span className="text-xs text-ink-400">None linked</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {parent.children.slice(0, 3).map((child) => (
                        <Badge key={child.id} tone="primary" className="normal-case">
                          {child.fullName}
                        </Badge>
                      ))}
                      {parent.children.length > 3 && (
                        <Badge tone="neutral">+{parent.children.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <Badge tone={parent.isActive ? 'success' : 'neutral'}>
                    {parent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onManage(parent)}>
                      Manage
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
