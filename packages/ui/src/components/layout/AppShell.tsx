import { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
