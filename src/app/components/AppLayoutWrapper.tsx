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
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-gray-950 transition-colors">
      <Sidebar />
      <div className="ml-64 flex flex-1 flex-col h-screen">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <GlobalSyncScreen>
            {children}
          </GlobalSyncScreen>
        </main>
      </div>
    </div>
  );
}