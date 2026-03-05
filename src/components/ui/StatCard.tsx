import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  subtext?: string;
  onClick?: () => void;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  subtext,
  onClick,
  loading,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-1"></div>
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-90`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
  );
}
