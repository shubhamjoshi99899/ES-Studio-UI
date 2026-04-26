import Link from "next/link";
import { Bot, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 px-4 lg:px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-3">
        <Link
          href="/ai-assistant"
          className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300"
        >
          <Bot size={16} />
          AI Assistant
        </Link>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <ThemeToggle />

        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4 transition-colors">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              User
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ADMIN</p>
          </div>
          <div className="h-9 w-9 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/30">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=ffd5dc"
              alt="User Avatar"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
