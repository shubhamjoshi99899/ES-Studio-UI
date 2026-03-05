'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import GlobalSyncScreen from './GlobalSyncScreen';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="min-h-screen bg-gray-50 dark:bg-gray-950">{children}</main>;
  }
  return (
    <GlobalSyncScreen>
      <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-gray-950 transition-colors">
        <Sidebar />
        <div className="ml-64 flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </GlobalSyncScreen>
  );
}