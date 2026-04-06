import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Facebook,
  Instagram,
  Settings2,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Calendar,
  GitCompare,
  Download,
  TableProperties,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { METRIC_CONFIG, MetricKey, Profile, DemographicData } from "../types";
import DateRangePicker from "../../components/DateRangePicker";
import DemographicsSection from "./DemographicsSection";

const TrendIndicator = ({ change }: { change: number }) => {
  if (isNaN(change) || change === 0)
    return (
      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
        <ArrowRight size={14} /> 0%
      </span>
    );
  if (change > 0)
    return (
      <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
        <ArrowUpRight size={14} /> {change}%
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
      <ArrowDownRight size={14} /> {Math.abs(change)}%
    </span>
  );
};

const getChange = (current: number, previous: number) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
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
  if (!res.ok) throw new Error(data.error || "Failed to fetch data");
  return data;
};

const fetchProfileDemographics = async ({ queryKey }: any) => {
  const [_key, profileId] = queryKey;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
  
  const res = await fetch(`${BACKEND_URL}/api/analytics/demographics/${profileId}`, {
    credentials: "include",
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch demographics");
  return data as DemographicData;
};


export default function ProfilesTab({ profile }: { profile: Profile | null }) {
  const initEnd = new Date();
  const initStart = new Date();
  initStart.setDate(initStart.getDate() - 30);

  const [preset, setPreset] = useState<string>("30");
  const [startDate, setStartDate] = useState(
    initStart.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(initEnd.toISOString().split("T")[0]);

  const [compareMode, setCompareMode] = useState<
    "previous" | "custom" | "none"
  >("previous");

  const initCompEnd = new Date(initStart.getTime() - 1000 * 60 * 60 * 24);
  const initCompStart = new Date(
    initCompEnd.getTime() - 1000 * 60 * 60 * 24 * 30,
  );
  const [compareStartDate, setCompareStartDate] = useState(
    initCompStart.toISOString().split("T")[0],
  );
  const [compareEndDate, setCompareEndDate] = useState(
    initCompEnd.toISOString().split("T")[0],
  );

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "profile", direction: "asc" });
  const [showSettings, setShowSettings] = useState(false);

  // --- Calculate Comparison Dates Upfront for React Query ---
  let actualCompareStart = compareStartDate;
  let actualCompareEnd = compareEndDate;
  if (compareMode === "previous") {
    const diffTime = Math.abs(
      new Date(endDate).getTime() - new Date(startDate).getTime(),
    );
    const prevEndObj = new Date(
      new Date(startDate).getTime() - 1000 * 60 * 60 * 24,
    );
    const prevStartObj = new Date(prevEndObj.getTime() - diffTime);
    actualCompareStart = prevStartObj.toISOString().split("T")[0];
    actualCompareEnd = prevEndObj.toISOString().split("T")[0];
  }

  // --- React Query: Fetch Current Period ---
  const { data: currentData, isLoading: loadingCurrent } = useQuery({
    queryKey: ["aggregate", profile ? [profile.profileId] : [], startDate, endDate],
    queryFn: fetchAggregatedData,
    enabled: !!profile,
    staleTime: 1000 * 60 * 5,
  });

  // --- React Query: Fetch Comparison Period (Parallel) ---
  const { data: compareData, isLoading: loadingCompare } = useQuery({
    queryKey: ["aggregate", profile ? [profile.profileId] : [], actualCompareStart, actualCompareEnd],
    queryFn: fetchAggregatedData,
    enabled: !!profile && compareMode !== "none",
    staleTime: 1000 * 60 * 5,
  });

  // Demographics for this individual profile
  const { data: demoData = null, isLoading: loadingDemos } = useQuery({
    queryKey: ["demographics-profile", profile?.profileId],
    queryFn: fetchProfileDemographics,
    enabled: !!profile,
    staleTime: 1000 * 60 * 10,
  });

  // Filter metrics — revenue only for Facebook
  const visibleMetrics = useMemo(() => {
    return (Object.keys(METRIC_CONFIG) as MetricKey[]).filter((key) => {
      const config = METRIC_CONFIG[key];
      if (config.fbOnly && profile?.platform !== "facebook") return false;
      return true;
    });
  }, [profile?.platform]);

  // --- Merge Data for Charts Using useMemo ---
  const chartData = useMemo(() => {
    if (!currentData || !currentData.timeSeries) return [];
    
    return currentData.timeSeries.map((point: any, index: number) => {
      const mergedPoint = { ...point };
      
      // Merge comparison data if it exists and comparison mode is active
      if (compareMode !== "none" && compareData && compareData.timeSeries && compareData.timeSeries[index]) {
        const compPoint = compareData.timeSeries[index];
        (Object.keys(METRIC_CONFIG) as MetricKey[]).forEach((key) => {
          mergedPoint[`prev_${key}`] = Math.round(compPoint[key] || 0);
        });
      }
      return mergedPoint;
    });
  }, [currentData, compareData, compareMode]);

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

  const exportCSV = () => {
    if (!currentData || !profile) return;
    const headers = [
      "Profile",
      "Audience",
      "Net Growth",
      "Impressions",
      "Engagements",
      "Engagement Rate",
      "Video Views",
    ];
    const row = [
      profile.name,
      currentData.totals.currentAudience,
      currentData.totals.netGrowth,
      currentData.totals.impressions,
      currentData.totals.engagements,
      currentData.totals.engagementRate,
      currentData.totals.videoViews,
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + row.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `profile_report_${startDate}_to_${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowSettings(false);
  };

  // Determine global loading state
  const loading = loadingCurrent || (compareMode !== "none" && loadingCompare);

  if (!profile)
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Please select a profile from the dropdown.
        </p>
      </div>
    );

  if (loading || !currentData) {
    return (
      <div className="flex h-64 flex-col gap-3 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-500 dark:text-gray-400 font-medium">
          Fetching profile data (syncing with Meta if needed)...
        </div>
      </div>
    );
  }

  if (currentData.timeSeries.length === 0)
    return (
      <div className="flex h-64 items-center justify-center text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No data available for {profile.name}.
        </p>
      </div>
    );

  const formattedStart = new Date(startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedEnd = new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedCompareStart = new Date(actualCompareStart).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
  const formattedCompareEnd = new Date(actualCompareEnd).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  const totals = currentData.totals;
  const compTotals = compareData?.totals;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ChevronsUpDown size={14} className="text-gray-400 dark:text-gray-500" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ChevronDown size={14} className="text-indigo-600 dark:text-indigo-400" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">
              Current:
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
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 md:pt-0 md:border-l md:border-gray-200 dark:md:border-gray-800 md:pl-4">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">
              Compare To:
            </span>
            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value as any)}
              className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-sm font-semibold text-indigo-700 dark:text-indigo-400 outline-none cursor-pointer rounded-md px-3 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <option value="previous">Previous Period</option>
              <option value="custom">Custom Range</option>
              <option value="none">No Comparison</option>
            </select>
          </div>

          {compareMode === "custom" && (
            <div className="animate-in fade-in slide-in-from-left-2">
              <DateRangePicker
                startDate={compareStartDate}
                endDate={compareEndDate}
                onChange={(s, e) => {
                  setCompareStartDate(s);
                  setCompareEndDate(e);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize">
            {profile.platform} Performance Breakdown
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Audience
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totals.currentAudience.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {visibleMetrics.map((key) => {
          const config = METRIC_CONFIG[key];
          const rawVal = Number((totals as any)[config.valueKey]) || 0;
          const val = rawVal;
          const displayVal = key === "revenue" ? `$${rawVal.toFixed(2)}` : rawVal.toLocaleString();

          let change = 0;
          if (compareMode !== "none" && compTotals) {
            const compVal = Number((compTotals as any)[config.valueKey]) || 0;
            change = getChange(val, compVal);
          }

          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {config.label}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {displayVal}
                      {key !== "revenue" && config.suffix}
                    </span>
                    {compareMode !== "none" && compTotals && (
                      <span
                        className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${change >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}
                      >
                        {change >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {Math.abs(change)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-16 w-full -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={`fill-${key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={config.color}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={config.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      formatter={(value: any, name: any) => [
                        value?.toLocaleString() || "0",
                        String(name).includes("prev_")
                          ? "Comparison"
                          : "Current",
                      ]}
                    />
                    {compareMode !== "none" && (
                      <Area
                        type="monotone"
                        dataKey={`prev_${key}`}
                        stroke="#6b7280"
                        strokeDasharray="4 4"
                        fill="transparent"
                        strokeWidth={2.5}
                        activeDot={{
                          r: 4,
                          fill: "#6b7280",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey={key}
                      stroke={config.color}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#fill-${key})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between bg-white dark:bg-gray-900 relative">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profiles</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review your aggregate profile and page metrics from the selected
              time period.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <Settings2 size={20} />
          </button>

          {showSettings && (
            <div className="absolute top-16 right-6 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl z-10 p-2 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-2">
                Table Options
              </p>
              <button
                onClick={exportCSV}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md font-semibold transition-colors"
              >
                <Download size={14} /> Export as CSV
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md font-semibold transition-colors"
              >
                <TableProperties size={14} /> Customize Columns
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-left">
                  <button
                    onClick={() => handleSort("profile")}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Profile {getSortIcon("profile")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("currentAudience")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Audience {getSortIcon("currentAudience")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("netGrowth")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Net Growth {getSortIcon("netGrowth")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("impressions")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Impressions {getSortIcon("impressions")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("engagements")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Engagements {getSortIcon("engagements")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("engagementRate")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Eng. Rate {getSortIcon("engagementRate")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("videoViews")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Video Views {getSortIcon("videoViews")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 text-left">
                  <p className="font-bold text-gray-900 dark:text-white">Reporting Period</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formattedStart} – {formattedEnd}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {totals.currentAudience.toLocaleString()}
                  </p>
                  {compareMode !== "none" && compTotals && (
                    <p className="text-xs mt-1 flex justify-end">
                      <TrendIndicator
                        change={getChange(
                          totals.currentAudience,
                          compTotals.currentAudience,
                        )}
                      />
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {totals.netGrowth.toLocaleString()}
                  </p>
                  {compareMode !== "none" && compTotals && (
                    <p className="text-xs mt-1 flex justify-end">
                      <TrendIndicator
                        change={getChange(
                          totals.netGrowth,
                          compTotals.netGrowth,
                        )}
                      />
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {totals.impressions.toLocaleString()}
                  </p>
                  {compareMode !== "none" && compTotals && (
                    <p className="text-xs mt-1 flex justify-end">
                      <TrendIndicator
                        change={getChange(
                          totals.impressions,
                          compTotals.impressions,
                        )}
                      />
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {totals.engagements.toLocaleString()}
                  </p>
                  {compareMode !== "none" && compTotals && (
                    <p className="text-xs mt-1 flex justify-end">
                      <TrendIndicator
                        change={getChange(
                          totals.engagements,
                          compTotals.engagements,
                        )}
                      />
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {totals.engagementRate}%
                  </p>
                  {compareMode !== "none" && compTotals && (
                    <p className="text-xs mt-1 flex justify-end">
                      <TrendIndicator
                        change={getChange(
                          parseFloat(String(totals.engagementRate)),
                          parseFloat(String(compTotals.engagementRate)),
                        )}
                      />
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {totals.videoViews.toLocaleString()}
                  </p>
                  {compareMode !== "none" && compTotals && (
                    <p className="text-xs mt-1 flex justify-end">
                      <TrendIndicator
                        change={getChange(
                          totals.videoViews,
                          compTotals.videoViews,
                        )}
                      />
                    </p>
                  )}
                </td>
              </tr>

              {compareMode !== "none" && compTotals && (
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b-2 border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
                  <td className="px-6 py-4 text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Compare To</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formattedCompareStart} – {formattedCompareEnd}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {compTotals.currentAudience.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {compTotals.netGrowth.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {compTotals.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {compTotals.engagements.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {compTotals.engagementRate}%
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {compTotals.videoViews.toLocaleString()}
                  </td>
                </tr>
              )}

              <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <td className="px-6 py-5 text-left flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase overflow-hidden">
                      {profile.name.substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm">
                      {profile.platform === "facebook" ? (
                        <Facebook
                          size={12}
                          className="text-[#1877F2] fill-[#1877F2]"
                        />
                      ) : (
                        <Instagram size={12} className="text-[#E1306C]" />
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.name}
                  </span>
                </td>
                <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">
                  {totals.currentAudience.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">
                  {totals.netGrowth.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">
                  {totals.impressions.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">
                  {totals.engagements.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">
                  {totals.engagementRate}%
                </td>
                <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">
                  {totals.videoViews.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Demographics for this profile */}
      <DemographicsSection data={demoData} loading={loadingDemos} />
    </div>
  );
}