import { useMemo } from "react";
import { BackendMetric } from "@/types";
import { Users, Globe } from "lucide-react";

interface DemographicsProps {
  rawData: BackendMetric[];
}

export function Demographics({ rawData }: DemographicsProps) {
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    rawData.forEach((row) => {
      const g = row.user_gender || "Unknown";
      counts[g] = (counts[g] || 0) + Number(row.sessions);
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label,
        value,
        percent: total ? (value / total) * 100 : 0,
      }));
  }, [rawData]);

  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    rawData.forEach((row) => {
      const c = row.country || "Unknown";
      counts[c] = (counts[c] || 0) + Number(row.sessions);
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5
      .map(([label, value]) => ({
        label,
        value,
        percent: total ? (value / total) * 100 : 0,
      }));
  }, [rawData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* Gender Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-6">
          <Users className="w-5 h-5 text-blue-500" /> Gender Distribution
        </h3>
        <div className="space-y-4">
          {genderData.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {item.label}
                </span>
                <span className="text-gray-500">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
          {genderData.length === 0 && (
            <p className="text-gray-400 text-sm">No gender data available.</p>
          )}
        </div>
      </div>

      {/* Country Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-6">
          <Globe className="w-5 h-5 text-emerald-500" /> Top Countries
        </h3>
        <div className="space-y-4">
          {countryData.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-4">
                  {item.label}
                </span>
                <span className="text-gray-500">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full"
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
    </div>
  );
}
