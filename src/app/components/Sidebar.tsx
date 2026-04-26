// src/app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  BarChart3,
  DollarSign,
  Settings,
  Sparkles,
  CalendarRange,
  MessageSquareMore,
  Siren,
  FolderKanban,
  Workflow,
  Users2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Web Traffic", href: "/traffic", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: BarChart2 },
  { name: "Revenue", href: "/revenue", icon: DollarSign },
  { name: "Schedule", href: "/schedule", icon: CalendarRange },
  { name: "Smart Inbox", href: "/smart-box", icon: MessageSquareMore },
  { name: "Insights", href: "/insights", icon: Siren },
  { name: "Campaigns", href: "/campaigns", icon: FolderKanban },
  { name: "Automation", href: "/automation", icon: Workflow },
  { name: "Team", href: "/team", icon: Users2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ${isCollapsed ? "w-16" : "w-56"}`}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center px-4 overflow-hidden">
        <div
          className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : ""}`}
        >
          <div className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
              SocialMetrics
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center rounded-xl py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              } ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"}`}
            >
              <Icon
                size={20}
                className={
                  isActive
                    ? "text-teal-700 dark:text-teal-300 min-w-[20px]"
                    : "min-w-[20px]"
                }
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-center rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
