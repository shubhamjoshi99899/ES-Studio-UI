import { useMemo } from "react";
import { BackendMetric } from "@/types";
import { Globe } from "lucide-react";

interface CountryStatsProps {
  rawData: BackendMetric[];
}

export function CountryStats({ rawData }: CountryStatsProps) {
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    rawData.forEach((row) => {
      const c = row.country || "Unknown";
      counts[c] = (counts[c] || 0) + Number(row.sessions);
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({
        label,
        value,
        percent: total ? (value / total) * 100 : 0,
      }));
  }, [rawData]);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm h-full flex flex-col">
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-6">
        <Globe className="w-5 h-5 text-emerald-500" /> Top Countries
      </h3>
      <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {countryData.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-0.5">
              <span
                className="font-medium text-gray-700 dark:text-gray-300 truncate pr-4"
                title={item.label}
              >
                {item.label}
              </span>
              <span className="text-gray-500 whitespace-nowrap">
                {item.percent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${item.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
        {countryData.length === 0 && (
          <p className="text-gray-400 text-sm">No country data available.</p>
        )}
      </div>
    </div>
  );
}
