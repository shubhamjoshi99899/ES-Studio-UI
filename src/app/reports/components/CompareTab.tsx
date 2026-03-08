import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, TrendingDown, Layers } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { METRIC_CONFIG, MetricKey } from "../types";
import DateRangePicker from "../../components/DateRangePicker";

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
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
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

export default function CompareTab({
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

  const [startDate, setStartDate] = useState(
    initStart.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(initEnd.toISOString().split("T")[0]);

  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
    "impressions",
    "engagements",
  ]);

  // --- React Query Implementation ---
  const { data: aggData, isLoading: loading } = useQuery({
    queryKey: ["aggregate", selectedProfileIds, startDate, endDate],
    queryFn: fetchAggregatedData,
    enabled: selectedProfileIds.length > 0, // Only fetch if profiles are selected
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

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

  const toggleMetric = (metric: MetricKey) => {
    if (selectedMetrics.includes(metric)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
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
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#6366f1]" />
                  Custom Comparison
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Select multiple metrics below to plot them on the same graph.
                </p>
              </div>
            </div>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex flex-wrap gap-2.5">
                {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
                  const itemConf = METRIC_CONFIG[key];
                  const isActive = selectedMetrics.includes(key);

                  return (
                    <button
                      key={key}
                      onClick={() => toggleMetric(key)}
                      style={{
                        borderColor: isActive ? itemConf.color : "",
                        backgroundColor: isActive ? `${itemConf.color}15` : "",
                        color: isActive ? itemConf.color : "",
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${!isActive && "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                    >
                      {itemConf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
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
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    />

                    {selectedMetrics.map((metricKey) => {
                      const config = METRIC_CONFIG[metricKey];
                      return (
                        <Line
                          key={metricKey}
                          type="monotone"
                          dataKey={metricKey}
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
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50/30 dark:bg-gray-800/30">
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Selected Metric
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Total Value
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Trend (% Change)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedMetrics.map((key) => {
                      const config = METRIC_CONFIG[key];
                      const val = (aggData.totals as any)[config.valueKey];
                      const change = Number(
                        (aggData.totals as any)[config.changeKey],
                      );

                      return (
                        <tr
                          key={key}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: config.color }}
                            ></span>
                            {config.title}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                            {val.toLocaleString()}
                            {config.suffix}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${change >= 0 ? "text-emerald-600" : "text-gray-500 dark:text-gray-400"}`}
                            >
                              {change >= 0 ? (
                                <TrendingUp size={14} />
                              ) : (
                                <TrendingDown size={14} />
                              )}
                              {Math.abs(change)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}