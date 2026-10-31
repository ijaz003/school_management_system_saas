import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar />
        <main className="flex-1 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-7xl animate-[fadeIn_180ms_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
