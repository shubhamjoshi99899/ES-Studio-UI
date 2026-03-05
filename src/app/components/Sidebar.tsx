'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart2, 
  BarChart3,
  CalendarDays, 
  Inbox, 
  Settings,
  Sparkles
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Web Traffic', href: '/traffic', icon: BarChart3 }, 
  { name: 'Reports', href: '/reports', icon: BarChart2 },
  { name: 'Schedule', href: '/schedule', icon: CalendarDays },
  { name: 'Smart Box', href: '/smart-box', icon: Inbox },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
          <Sparkles size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          SocialMetrics
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-700 dark:text-indigo-400' : ''} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Usage Widget (Bottom) */}
      <div className="p-4 mt-auto">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 transition-colors duration-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Usage
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-1.5 w-3/4 rounded-full bg-indigo-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            75% of data credits used
          </p>
        </div>
      </div>
    </aside>
  );
}