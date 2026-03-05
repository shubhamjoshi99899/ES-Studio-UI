import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformTabProps {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: LucideIcon;
}

export function PlatformTab({
  active,
  label,
  onClick,
  icon: Icon,
}: PlatformTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all rounded-t-lg border-b-2",
        active
          ? "border-blue-600 text-blue-600 bg-blue-50/50"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
