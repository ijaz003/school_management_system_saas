// src/App.tsx
import {
  selectIsAuthenticated,
  selectUser,
} from '@/store/selectors/permissions';
import { useAppSelector } from '@/store/hooks';

export default function App() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <section className="card w-full max-w-md rounded-2xl p-8 shadow-xl">
        <div className="text-center">
          <div className="mb-4 text-5xl" aria-hidden="true">
            🎓
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">SchoolSaaS</h1>
          <p className="mb-6 text-sm text-gray-600">
            Redux and React Query are ready.
          </p>
        </div>
        <ul className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          {[
            'Redux Toolkit store configured',
            'React Query provider configured',
            'Fetch-based API client ready',
            'Notifications and development tools ready',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-green-600" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm">
          <div className="mb-1 font-semibold text-blue-900">Current state</div>
          <div className="text-blue-700">
            Auth: {isAuthenticated ? 'Logged in' : 'Not logged in'}
          </div>
          {user && <div className="text-blue-700">User: {user.fullName}</div>}
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          Ready to build real features.
        </p>
      </section>
    </main>
  );
}