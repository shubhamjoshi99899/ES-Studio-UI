import { Search, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle'; 

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 px-8 backdrop-blur-md transition-colors">
      <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 transition-colors">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search reports, metrics..." 
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex items-center gap-4">
        
        <ThemeToggle />

        <button className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
        </button>
        
        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4 transition-colors">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Alex Rivera</p>
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