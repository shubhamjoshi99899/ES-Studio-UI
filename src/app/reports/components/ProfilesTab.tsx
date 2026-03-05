import React, { useEffect, useState } from "react";
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
import { METRIC_CONFIG, MetricKey, AggregatedData, Profile } from "../types";
import DateRangePicker from "../../components/DateRangePicker";

const TrendIndicator = ({ change }: { change: number }) => {
  if (isNaN(change) || change === 0)
    return (
      <span className="flex items-center gap-1 text-gray-500">
        <ArrowRight size={14} /> 0%
      </span>
    );
  if (change > 0)
    return (
      <span className="flex items-center gap-1 text-teal-600">
        <ArrowUpRight size={14} /> {change}%
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-gray-500">
      <ArrowDownRight size={14} /> {Math.abs(change)}%
    </span>
  );
};

const getChange = (current: number, previous: number) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
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

  const [data, setData] = useState<AggregatedData | null>(null);
  const [compareData, setCompareData] = useState<AggregatedData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "profile", direction: "asc" });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    const fetchCurrent: Promise<AggregatedData> = fetch(
      "http://localhost:5000/api/analytics/aggregate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profileIds: [profile.profileId],
          startDate,
          endDate,
        }),
      },
    ).then((res) => res.json());

    let fetchCompare: Promise<AggregatedData | null> = Promise.resolve(null);

    if (compareMode !== "none") {
      let cStart = compareStartDate;
      let cEnd = compareEndDate;

      if (compareMode === "previous") {
        const diffTime =
          new Date(endDate).getTime() - new Date(startDate).getTime();
        const pEnd = new Date(
          new Date(startDate).getTime() - 1000 * 60 * 60 * 24,
        );
        const pStart = new Date(pEnd.getTime() - diffTime);
        cStart = pStart.toISOString().split("T")[0];
        cEnd = pEnd.toISOString().split("T")[0];
      }

      fetchCompare = fetch("http://localhost:5000/api/analytics/aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profileIds: [profile.profileId],
          startDate: cStart,
          endDate: cEnd,
        }),
      }).then((res) => res.json());
    }

    Promise.all([fetchCurrent, fetchCompare])
      .then(([resCurrent, resCompare]) => {
        setData(resCurrent);
        setCompareData(resCompare);

        if (resCurrent && resCurrent.timeSeries) {
          const merged = resCurrent.timeSeries.map(
            (point: any, index: number) => {
              const mergedPoint = { ...point };
              if (
                resCompare &&
                resCompare.timeSeries &&
                resCompare.timeSeries[index]
              ) {
                const compPoint = resCompare.timeSeries[index];
                (Object.keys(METRIC_CONFIG) as MetricKey[]).forEach((key) => {
                  mergedPoint[`prev_${key}`] = Math.round(compPoint[key] || 0);
                });
              }
              return mergedPoint;
            },
          );
          setChartData(merged);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [
    profile,
    startDate,
    endDate,
    compareMode,
    compareStartDate,
    compareEndDate,
  ]);

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
    if (!data || !profile) return;
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
      data.totals.currentAudience,
      data.totals.netGrowth,
      data.totals.impressions,
      data.totals.engagements,
      data.totals.engagementRate,
      data.totals.videoViews,
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

  if (!profile)
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm">
        <p className="text-gray-500 font-medium">
          Please select a profile from the dropdown.
        </p>
      </div>
    );
  if (loading || !data) {
    return (
      <div className="flex h-64 flex-col gap-3 items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-500 font-medium">
          Fetching profile data (syncing with Meta if needed)...
        </div>
      </div>
    );
  }
  if (data.timeSeries.length === 0)
    return (
      <div className="flex h-64 items-center justify-center text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <p className="text-gray-500 font-medium">
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
  const formattedCompareStart = new Date(actualCompareStart).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
  const formattedCompareEnd = new Date(actualCompareEnd).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  const { totals } = data;
  const compTotals = compareData?.totals;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ChevronsUpDown size={14} className="text-gray-400" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-indigo-600" />
    ) : (
      <ChevronDown size={14} className="text-indigo-600" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 hidden sm:inline">
              Current:
            </span>
            <select
              value={preset}
              onChange={handlePresetChange}
              className="bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 outline-none cursor-pointer rounded-md px-3 py-1.5 hover:bg-gray-100 transition-colors"
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

        <div className="flex flex-wrap items-center gap-4 pt-4 md:pt-0 md:border-l md:border-gray-200 md:pl-4">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 hidden sm:inline">
              Compare To:
            </span>
            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value as any)}
              className="bg-indigo-50 border border-indigo-100 text-sm font-semibold text-indigo-700 outline-none cursor-pointer rounded-md px-3 py-1.5 hover:bg-indigo-100 transition-colors"
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

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
          <span className="text-sm font-semibold text-gray-500 capitalize">
            {profile.platform} Performance Breakdown
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Total Audience
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {totals.currentAudience.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
          const config = METRIC_CONFIG[key];
          const val = Number((totals as any)[config.valueKey]) || 0;

          let change = 0;
          if (compareMode !== "none" && compTotals) {
            const compVal = Number((compTotals as any)[config.valueKey]) || 0;
            change = getChange(val, compVal);
          }

          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {config.label}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {val.toLocaleString()}
                      {config.suffix}
                    </span>
                    {compareMode !== "none" && compTotals && (
                      <span
                        className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-start justify-between bg-white relative">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profiles</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review your aggregate profile and page metrics from the selected
              time period.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
          >
            <Settings2 size={20} />
          </button>

          {showSettings && (
            <div className="absolute top-16 right-6 w-48 bg-white border border-gray-200 shadow-xl rounded-xl z-10 p-2 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
                Table Options
              </p>
              <button
                onClick={exportCSV}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md font-semibold"
              >
                <Download size={14} /> Export as CSV
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md font-semibold"
              >
                <TableProperties size={14} /> Customize Columns
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="bg-white text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-left">
                  <button
                    onClick={() => handleSort("profile")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Profile {getSortIcon("profile")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("currentAudience")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900"
                  >
                    Audience {getSortIcon("currentAudience")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("netGrowth")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900"
                  >
                    Net Growth {getSortIcon("netGrowth")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("impressions")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900"
                  >
                    Impressions {getSortIcon("impressions")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("engagements")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900"
                  >
                    Engagements {getSortIcon("engagements")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("engagementRate")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900"
                  >
                    Eng. Rate {getSortIcon("engagementRate")}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">
                  <button
                    onClick={() => handleSort("videoViews")}
                    className="flex items-center justify-end gap-1 w-full hover:text-gray-900"
                  >
                    Video Views {getSortIcon("videoViews")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-left">
                  <p className="font-bold text-gray-900">Reporting Period</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formattedStart} – {formattedEnd}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">
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
                  <p className="font-bold text-gray-900">
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
                  <p className="font-bold text-gray-900">
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
                  <p className="font-bold text-gray-900">
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
                  <p className="font-bold text-gray-900">
                    {totals.engagementRate}%
                  </p>
                  {compareMode !== "none" && compTotals && (
                    <p className="text-xs mt-1 flex justify-end">
                      <TrendIndicator
                        change={getChange(
                          parseFloat(totals.engagementRate),
                          parseFloat(compTotals.engagementRate),
                        )}
                      />
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">
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
                <tr className="hover:bg-gray-50 transition-colors border-b-2 border-gray-100 bg-gray-50/30">
                  <td className="px-6 py-4 text-left">
                    <p className="font-bold text-gray-900">Compare To</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formattedCompareStart} – {formattedCompareEnd}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {compTotals.currentAudience.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {compTotals.netGrowth.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {compTotals.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {compTotals.engagements.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {compTotals.engagementRate}%
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {compTotals.videoViews.toLocaleString()}
                  </td>
                </tr>
              )}

              <tr className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-5 text-left flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase overflow-hidden">
                      {profile.name.substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
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
                  <span className="font-semibold text-gray-900">
                    {profile.name}
                  </span>
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium">
                  {totals.currentAudience.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium">
                  {totals.netGrowth.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium">
                  {totals.impressions.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium">
                  {totals.engagements.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium">
                  {totals.engagementRate}%
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium">
                  {totals.videoViews.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
