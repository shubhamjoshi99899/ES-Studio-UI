import { Search, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 px-4 lg:px-6 backdrop-blur-md transition-colors">
      <div />
      
      <div className="flex items-center gap-6">
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
