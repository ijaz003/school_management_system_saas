import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { useActivateSchool } from '../hooks/useActivateSchool';
import { useSuspendSchool } from '../hooks/useSuspendSchool';
import type { School } from '../hooks/useSchools';

export function SchoolsTable({ schools }: { schools: School[] }) {
  const navigate = useNavigate();
  const suspendSchool = useSuspendSchool();
  const activateSchool = useActivateSchool();

  if (schools.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">🏫</div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">No schools found</h2>
        <p className="text-sm text-gray-500">Try changing the filters or create a school.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            {['School', 'Owner', 'Plan', 'Status', 'Created', 'Actions'].map((label) => (
              <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {schools.map((school) => (
            <tr key={school.id} className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-4">
                <div className="font-medium text-gray-900">{school.name}</div>
                <div className="mt-0.5 text-xs text-gray-500">{school.slug}</div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-900">{school.ownerName}</div>
                <div className="text-xs text-gray-500">{school.ownerEmail}</div>
              </td>
              <td className="px-4 py-4 text-sm capitalize text-gray-700">{school.plan}</td>
              <td className="px-4 py-4"><StatusBadge status={school.status} /></td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{new Date(school.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/schools/${school.id}`)}>
                    <Eye className="h-4 w-4" aria-hidden="true" /> View
                  </Button>
                  {school.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={suspendSchool.isPending}
                      onClick={() => {
                        if (window.confirm(`Suspend ${school.name}?`)) suspendSchool.mutate(school.id);
                      }}
                    >
                      Suspend
                    </Button>
                  )}
                  {school.status === 'suspended' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:bg-green-50 hover:text-green-700"
                      isLoading={activateSchool.isPending && activateSchool.variables === school.id}
                      disabled={activateSchool.isPending}
                      onClick={() => activateSchool.mutate(school.id)}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
