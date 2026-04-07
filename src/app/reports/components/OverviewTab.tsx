import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { METRIC_CONFIG, MetricKey, DemographicData } from "../types";
import DemographicsSection from "./DemographicsSection";
import DateRangePicker from "../../components/DateRangePicker";
import {
  Settings2,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Download,
} from "lucide-react";

const CustomXAxisTick = ({ x, y, payload, index }: any) => {
  const date = new Date(payload.value);
  const day = date.getDate();
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const showMonth = index === 0 || day === 1;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={11}
        fontWeight={500}
      >
        <tspan x="0" dy="0">
          {day}
        </tspan>
        {showMonth && (
          <tspan x="0" dy="14" fontWeight="bold" fill="#374151">
            {month}
          </tspan>
        )}
      </text>
    </g>
  );
};

// --- React Query Fetch Function ---
const fetchAggregatedData = async ({ queryKey }: any) => {
  const [_key, profileIds, startDate, endDate] = queryKey;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
  
  const res = await fetch(`${BACKEND_URL}/api/analytics/aggregate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ profileIds, startDate, endDate }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch data from backend");
  return data;
};

const fetchAggregatedDemographics = async ({ queryKey }: any) => {
  const [_key, profileIds] = queryKey;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
  
  const res = await fetch(`${BACKEND_URL}/api/analytics/demographics/aggregate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ profileIds }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch demographics");
  return data as DemographicData;
};

/* ─── CSV Export ─── */
function exportOverviewCSV(
  aggData: any,
  visibleMetrics: MetricKey[],
  startDate: string,
  endDate: string,
) {
  const rows: string[][] = [];

  // --- Section 1: Summary totals ---
  rows.push(["Metric", "Value", "Change (%)"]);
  for (const key of visibleMetrics) {
    const cfg = METRIC_CONFIG[key];
    const rawVal = (aggData.totals as any)[cfg.valueKey];
    const displayVal =
      key === "revenue"
        ? `$${Number(rawVal).toFixed(2)}`
        : `${Number(rawVal).toLocaleString()}${cfg.suffix || ""}`;
    const change = (aggData.totals as any)[cfg.changeKey];
    rows.push([cfg.label, displayVal, `${change}%`]);
  }

  // --- Blank separator ---
  rows.push([]);

  // --- Section 2: Daily time series ---
  const metricHeaders = visibleMetrics.map((k) => METRIC_CONFIG[k].label);
  rows.push(["Date", ...metricHeaders]);

  for (const day of aggData.timeSeries) {
    const values = visibleMetrics.map((k) => {
      const v = (day as any)[k];
      return v != null ? String(v) : "0";
    });
    rows.push([day.date, ...values]);
  }

  // --- Build CSV string and trigger download ---
  const csvContent = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `overview_report_${startDate}_to_${endDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OverviewTab({
  selectedProfileIds,
  activePlatform,
}: {
  selectedProfileIds: string[];
  activePlatform: string;
}) {
  const [preset, setPreset] = useState<string>("30");
  const initEnd = new Date();
  const initStart = new Date();
  initStart.setDate(initStart.getDate() - 30);

  const [startDate, setStartDate] = useState(initStart.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(initEnd.toISOString().split("T")[0]);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("netFollowers");

  // --- React Query Implementation ---
  const { data: aggData, isLoading: loading, error } = useQuery({
    queryKey: ["aggregate", selectedProfileIds, startDate, endDate],
    queryFn: fetchAggregatedData,
    enabled: selectedProfileIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch aggregated demographics for all selected profiles
  const { data: demoData = null, isLoading: loadingDemos } = useQuery({
    queryKey: ["demographics-aggregated", selectedProfileIds],
    queryFn: fetchAggregatedDemographics,
    enabled: selectedProfileIds.length > 0,
    staleTime: 1000 * 60 * 10, // Cache for 10 min (lifetime data)
  });

  // Filter metrics — revenue only for Facebook
  const visibleMetrics = useMemo(() => {
    return (Object.keys(METRIC_CONFIG) as MetricKey[]).filter((key) => {
      const config = METRIC_CONFIG[key];
      if (config.fbOnly && activePlatform !== "facebook") return false;
      return true;
    });
  }, [activePlatform]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== "custom") {
      const days = parseInt(val);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  const handleCustomDateChange = (s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
    setPreset("custom");
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col gap-3 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-500 dark:text-gray-400 font-medium">
          Fetching data (syncing with Meta if needed)...
        </div>
      </div>
    );
  }

  const hasData = aggData && aggData.timeSeries && aggData.timeSeries.length > 0;
  const config = METRIC_CONFIG[activeMetric];
  const ChartComponent = config?.type === "area" ? AreaChart : LineChart;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Date Range:
          </span>
          <select
            value={preset}
            onChange={handlePresetChange}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer rounded-md px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {preset === "custom" && (
          <div className="animate-in fade-in slide-in-from-left-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleCustomDateChange}
            />
          </div>
        )}

        <div className="ml-auto">
          <button
            onClick={() => exportOverviewCSV(aggData, visibleMetrics, startDate, endDate)}
            disabled={!hasData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Download size={16} />
            Download CSV
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No data available for the selected dates.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Performance Summary
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  View your key profile performance metrics. Click a metric to
                  update the graph below.
                </p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Settings2 size={18} />
              </button>
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-2 gap-1`}>
              {visibleMetrics.map((key) => {
                const itemConf = METRIC_CONFIG[key];
                const rawVal = (aggData.totals as any)[itemConf.valueKey];
                const val = key === "revenue" ? `$${Number(rawVal).toFixed(2)}` : rawVal;
                const displayVal = key === "revenue" ? val : rawVal.toLocaleString();
                const change = Number(
                  (aggData.totals as any)[itemConf.changeKey],
                );
                const isActive = activeMetric === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveMetric(key)}
                    className={`flex flex-col items-start px-4 py-3 rounded-lg transition-all text-left border ${isActive ? "bg-[#f4f7fe] dark:bg-indigo-900/30 border-[#6366f1] dark:border-indigo-600 shadow-sm" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >
                    <p
                      className={`text-xs font-medium mb-2 border-b border-dashed pb-0.5 ${isActive ? "text-[#6366f1] border-[#6366f1]/50" : "text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600"}`}
                    >
                      {itemConf.label}
                    </p>
                    <div className="flex flex-col lg:flex-row lg:items-baseline gap-1.5 w-full">
                      <span
                        className={`text-xl xl:text-2xl font-bold ${isActive ? "text-[#6366f1]" : "text-gray-800 dark:text-white"}`}
                      >
                        {displayVal}
                        {key !== "revenue" && itemConf.suffix}
                      </span>
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 ${change >= 0 ? "text-emerald-600" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        {change >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {Math.abs(change)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {config.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.desc}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ChartComponent
                    data={aggData.timeSeries}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#e5e7eb"
                      strokeDasharray="0"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomXAxisTick />}
                      tickMargin={10}
                      minTickGap={30}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#4b5563", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      }
                    />
                    {config.type === "area" ? (
                      <Area
                        type="monotone"
                        dataKey={activeMetric}
                        name={config.title}
                        stroke={config.color}
                        fill={config.color}
                        fillOpacity={1}
                        strokeWidth={0}
                        activeDot={{
                          r: 6,
                          fill: config.color,
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey={activeMetric}
                        name={config.title}
                        stroke={config.color}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: config.color,
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    )}
                  </ChartComponent>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50/30 dark:bg-gray-800/30">
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">
                        {config.title} Metrics
                      </th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Totals
                      </th>
                      <th className="px-4 py-3 font-semibold text-right">
                        % Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">
                        {config.title}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white">
                        {(aggData.totals as any)[
                          config.valueKey
                        ].toLocaleString()}
                        {config.suffix}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${Number((aggData.totals as any)[config.changeKey]) >= 0 ? "text-emerald-600" : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {Number((aggData.totals as any)[config.changeKey]) >=
                          0 ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                          {Math.abs(
                            Number((aggData.totals as any)[config.changeKey]),
                          )}
                          %
                        </span>
                      </td>
                    </tr>

                    {activeMetric === "netFollowers" && (
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">
                          Total Audience
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white">
                          {aggData.totals.currentAudience.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${Number(aggData.totals.audienceChange) >= 0 ? "text-emerald-600" : "text-gray-500 dark:text-gray-400"}`}
                          >
                            {Number(aggData.totals.audienceChange) >= 0 ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            {Math.abs(Number(aggData.totals.audienceChange))}%
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Demographics Section */}
      {hasData && (
        <DemographicsSection data={demoData} loading={loadingDemos} />
      )}

      {error && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-600 text-white px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <span className="text-sm font-semibold tracking-wide">
            {error instanceof Error ? error.message : "Failed to fetch data"}
          </span>
        </div>
      )}
    </div>
  );
}