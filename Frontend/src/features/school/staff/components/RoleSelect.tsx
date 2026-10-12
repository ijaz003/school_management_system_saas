import { useAvailableRoles } from '../hooks/useAvailableRoles';

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RoleSelect({ value, onChange, error }: RoleSelectProps) {
  const rolesQuery = useAvailableRoles();
  const systemRoles = rolesQuery.data?.filter((role) => role.isSystem) ?? [];
  const customRoles = rolesQuery.data?.filter((role) => !role.isSystem) ?? [];

  if (rolesQuery.error) {
    return (
      <div>
        <label htmlFor="staff-role" className="mb-1.5 block text-sm font-medium text-gray-700">Role *</label>
        <p className="text-sm text-red-600">Could not load roles: {rolesQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="staff-role" className="mb-1.5 block text-sm font-medium text-gray-700">
        Role <span className="text-red-500">*</span>
      </label>
      <select
        id="staff-role"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'staff-role-error' : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={rolesQuery.isPending}
      >
        <option value="">{rolesQuery.isPending ? 'Loading roles...' : 'Select role...'}</option>
        {systemRoles.length > 0 && (
          <optgroup label="System roles">
            {systemRoles.map((role) => <option key={role.id} value={role.id}>{role.displayName}</option>)}
          </optgroup>
        )}
        {customRoles.length > 0 && (
          <optgroup label="Custom roles">
            {customRoles.map((role) => <option key={role.id} value={role.id}>{role.displayName}</option>)}
          </optgroup>
        )}
      </select>
      {error && <p id="staff-role-error" className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">Role determines permissions and access level.</p>
    </div>
  );
}
