import { useState, useMemo } from "react";
import { AggregatedPageData } from "@/types";
import { format, parseISO } from "date-fns";
import { BarChart3, Settings, Download, LayoutGrid, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface TrafficTableProps {
  data: AggregatedPageData[];
  dateHeaders: string[];
  onOpenMappings?: () => void;
}

type MetricType = "sessions" | "users" | "pageviews" | "engagement_rate";
type ViewMode = "category" | "team";

const TEAM_BADGE_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
];

const TEAM_ROW_GRADIENTS = [
  "bg-gradient-to-r from-violet-50/80 to-indigo-50/60 dark:from-violet-900/20 dark:to-indigo-900/10",
  "bg-gradient-to-r from-blue-50/80 to-sky-50/60 dark:from-blue-900/20 dark:to-sky-900/10",
  "bg-gradient-to-r from-emerald-50/80 to-teal-50/60 dark:from-emerald-900/20 dark:to-teal-900/10",
  "bg-gradient-to-r from-amber-50/80 to-yellow-50/60 dark:from-amber-900/20 dark:to-yellow-900/10",
  "bg-gradient-to-r from-rose-50/80 to-pink-50/60 dark:from-rose-900/20 dark:to-pink-900/10",
  "bg-gradient-to-r from-cyan-50/80 to-teal-50/60 dark:from-cyan-900/20 dark:to-teal-900/10",
  "bg-gradient-to-r from-orange-50/80 to-amber-50/60 dark:from-orange-900/20 dark:to-amber-900/10",
  "bg-gradient-to-r from-pink-50/80 to-rose-50/60 dark:from-pink-900/20 dark:to-rose-900/10",
];

export function TrafficTable({ data, dateHeaders, onOpenMappings }: TrafficTableProps) {
  const [gridMetric, setGridMetric] = useState<MetricType>("sessions");
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  // ---------- Category grouping ----------
  const categoryGroupedData = useMemo(() => {
    const groups: Record<
      string,
      {
        rows: AggregatedPageData[];
        totals: any;
        dailyTotals: Record<string, any>;
      }
    > = {};

    data.forEach((row) => {
      if (!groups[row.category]) {
        groups[row.category] = {
          rows: [],
          totals: {
            sessions: 0,
            users: 0,
            pageviews: 0,
            engagement_sum: 0,
            count: 0,
          },
          dailyTotals: {},
        };
      }
      const g = groups[row.category];
      g.rows.push(row);

      g.totals.sessions += row.totals.sessions;
      g.totals.users += row.totals.users;
      g.totals.pageviews += row.totals.pageviews;
      g.totals.engagement_sum += row.totals.engagement_rate_avg;
      g.totals.count += 1;

      row.dailyTrend.forEach((day) => {
        if (!g.dailyTotals[day.date]) {
          g.dailyTotals[day.date] = {
            sessions: 0,
            users: 0,
            pageviews: 0,
            engagement_sum: 0,
            count: 0,
          };
        }
        const d = g.dailyTotals[day.date];
        d.sessions += day.sessions;
        d.users += day.users;
        d.pageviews += day.pageviews;
        d.engagement_sum += day.engagement_rate;
        d.count += 1;
      });
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  // ---------- Team grouping ----------
  const teamGroupedData = useMemo(() => {
    const groups: Record<
      string,
      {
        rows: AggregatedPageData[];
        totals: any;
        dailyTotals: Record<string, any>;
      }
    > = {};

    data.forEach((row) => {
      const teamKey = row.team?.trim() || "Unassigned";

      if (!groups[teamKey]) {
        groups[teamKey] = {
          rows: [],
          totals: {
            sessions: 0,
            users: 0,
            pageviews: 0,
            engagement_sum: 0,
            count: 0,
          },
          dailyTotals: {},
        };
      }
      const g = groups[teamKey];
      g.rows.push(row);

      g.totals.sessions += row.totals.sessions;
      g.totals.users += row.totals.users;
      g.totals.pageviews += row.totals.pageviews;
      g.totals.engagement_sum += row.totals.engagement_rate_avg;
      g.totals.count += 1;

      row.dailyTrend.forEach((day) => {
        if (!g.dailyTotals[day.date]) {
          g.dailyTotals[day.date] = {
            sessions: 0,
            users: 0,
            pageviews: 0,
            engagement_sum: 0,
            count: 0,
          };
        }
        const d = g.dailyTotals[day.date];
        d.sessions += day.sessions;
        d.users += day.users;
        d.pageviews += day.pageviews;
        d.engagement_sum += day.engagement_rate;
        d.count += 1;
      });
    });

    // Sort: Unassigned always last, rest alphabetically
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === "Unassigned") return 1;
      if (b[0] === "Unassigned") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [data]);

  const groupedData = viewMode === "category" ? categoryGroupedData : teamGroupedData;

  const teamColorIndex = useMemo(() => {
    const map: Record<string, number> = {};
    teamGroupedData.forEach(([name], idx) => {
      map[name] = idx % TEAM_BADGE_COLORS.length;
    });
    return map;
  }, [teamGroupedData]);

  // ---------- Metric helpers ----------
  const getMetricForDate = (row: AggregatedPageData, dateStr: string) => {
    const dayData = row.dailyTrend.find((d) => d.date === dateStr);
    if (!dayData) return 0;
    if (gridMetric === "engagement_rate")
      return (dayData.engagement_rate * 100).toFixed(1) + "%";
    return dayData[gridMetric] || 0;
  };

  const getGroupMetricForDate = (
    dailyTotals: Record<string, any>,
    dateStr: string,
  ) => {
    const dayData = dailyTotals[dateStr];
    if (!dayData) return 0;
    if (gridMetric === "engagement_rate")
      return (
        ((dayData.engagement_sum / (dayData.count || 1)) * 100).toFixed(1) + "%"
      );
    return dayData[gridMetric] || 0;
  };

  // ---------- CSV Export ----------
  const handleExportCSV = () => {
    if (!groupedData.length) return;

    const isTeamView = viewMode === "team";
    const firstColumnHeader = isTeamView ? "Team / Page Name" : "Category / Page Name";

    const headers = [
      firstColumnHeader,
      "Total Sessions",
      "Total Users",
      "Total Pageviews",
      "Avg Engagement Rate",
      ...dateHeaders.map((d) => `${d} (${gridMetric})`),
    ];

    const csvRows = [headers.join(",")];

    groupedData.forEach(([groupName, groupData]) => {
      const { rows, totals, dailyTotals } = groupData;

      // 1. Group Header Row (Mirrors the colored total row in the UI)
      const groupRowData = [
        `"[${groupName.toUpperCase()}]"`,
        totals.sessions,
        totals.users,
        totals.pageviews,
        `"${((totals.engagement_sum / (totals.count || 1)) * 100).toFixed(1)}%"`,
      ];

      dateHeaders.forEach((date) => {
        const val = getGroupMetricForDate(dailyTotals, date);
        if (gridMetric === "engagement_rate") {
          groupRowData.push(`"${val}"`);
        } else {
          groupRowData.push(String(val || 0));
        }
      });
      csvRows.push(groupRowData.join(","));

      // 2. Individual Page Rows
      rows.forEach((row) => {
        let pageNameDisplay = row.pageName;
        if (isTeamView && row.category) {
          pageNameDisplay += ` [${row.category}]`;
        } else if (!isTeamView && row.team) {
          pageNameDisplay += ` [${row.team}]`;
        }

        const rowData = [
          `"   ${pageNameDisplay}"`, // Indented visually to show hierarchy
          row.totals.sessions,
          row.totals.users,
          row.totals.pageviews,
          `"${(row.totals.engagement_rate_avg * 100).toFixed(1)}%"`,
        ];

        dateHeaders.forEach((date) => {
          const val = getMetricForDate(row, date);
          if (gridMetric === "engagement_rate") {
            rowData.push(`"${val}"`);
          } else {
            rowData.push(String(val || 0));
          }
        });

        csvRows.push(rowData.join(","));
      });
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `traffic_${viewMode}_export_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Shared row renderer ----------
  const renderGroupRows = (
    groupName: string,
    groupData: { rows: AggregatedPageData[]; totals: any; dailyTotals: Record<string, any> },
    colorIdx: number,
  ) => {
    const { rows, totals, dailyTotals } = groupData;
    const isTeamView = viewMode === "team";
    const badgeClass = isTeamView
      ? TEAM_BADGE_COLORS[colorIdx % TEAM_BADGE_COLORS.length]
      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
    const headerRowClass = isTeamView
      ? TEAM_ROW_GRADIENTS[colorIdx % TEAM_ROW_GRADIENTS.length] +
      " border-y border-gray-200 dark:border-gray-700"
      : "bg-gray-100 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700";
    const stickyHeaderClass = isTeamView
      ? TEAM_ROW_GRADIENTS[colorIdx % TEAM_ROW_GRADIENTS.length].replace(
        "bg-gradient-to-r ",
        "",
      ) + " dark:bg-gray-800"
      : "bg-gray-100 dark:bg-gray-800";

    return (
      <React.Fragment key={groupName}>
        {/* Group Header Row */}
        <tr className={headerRowClass}>
          <td
            className={cn(
              "px-6 py-4 sticky left-0 z-20 border-r border-gray-200/60 dark:border-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] dark:shadow-none",
              stickyHeaderClass,
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-800 dark:text-gray-200 text-base uppercase tracking-wide">
                {groupName}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  badgeClass,
                )}
              >
                {rows.length}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200">
            {totals.sessions.toLocaleString()}
          </td>
          <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200">
            {totals.users.toLocaleString()}
          </td>
          <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200">
            {totals.pageviews.toLocaleString()}
          </td>
          <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200">
            {((totals.engagement_sum / (totals.count || 1)) * 100).toFixed(1)}%
          </td>

          {dateHeaders.map((date) => {
            const val = getGroupMetricForDate(dailyTotals, date);
            const isZero = val === 0 || val === "0.0%";
            return (
              <td
                key={date}
                className={cn(
                  "px-6 py-4 text-right font-bold tabular-nums border-l border-dashed border-gray-300/50 dark:border-gray-700",
                  isZero
                    ? "text-gray-400 dark:text-gray-600"
                    : "text-gray-800 dark:text-gray-300",
                )}
              >
                {isZero
                  ? "-"
                  : typeof val === "number"
                    ? val.toLocaleString()
                    : val}
              </td>
            );
          })}
        </tr>

        {/* Page Rows */}
        {rows.map((row) => (
          <tr
            key={row.pageName}
            className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors group"
          >
            <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/20 dark:group-hover:bg-blue-900/10 border-r border-gray-100 dark:border-gray-800 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.02)] dark:shadow-none">
              <div className="flex items-center gap-2 w-72 flex-wrap">
                <div className="truncate shrink-0" title={row.pageName}>
                  {row.pageName}
                </div>
                {/* Category badge in team view */}
                {isTeamView && row.category && (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    {row.category}
                  </span>
                )}
                {/* Team badge in category view */}
                {!isTeamView && row.team && (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700">
                    {row.team}
                  </span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-900/10">
              {row.totals.sessions.toLocaleString()}
            </td>
            <td className="px-6 py-4 text-right font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-900/10">
              {row.totals.users.toLocaleString()}
            </td>
            <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 dark:bg-emerald-900/10">
              {row.totals.pageviews.toLocaleString()}
            </td>
            <td className="px-6 py-4 text-right font-semibold text-amber-600 dark:text-amber-500 bg-amber-50/10 dark:bg-amber-900/10">
              {(row.totals.engagement_rate_avg * 100).toFixed(1)}%
            </td>

            {dateHeaders.map((date) => {
              const val = getMetricForDate(row, date);
              const isZero = val === 0 || val === "0.0%";
              return (
                <td
                  key={date}
                  className={cn(
                    "px-6 py-4 text-right tabular-nums border-l border-dashed border-gray-100 dark:border-gray-800",
                    isZero
                      ? "text-gray-300 dark:text-gray-700"
                      : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  {isZero
                    ? "-"
                    : typeof val === "number"
                      ? val.toLocaleString()
                      : val}
                </td>
              );
            })}
          </tr>
        ))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-full max-h-[900px] max-w-[85vw] overflow-scroll">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm z-20 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
            Detailed Breakdown
          </h3>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 ml-3">
            <button
              onClick={() => setViewMode("category")}
              title="Group by Category"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === "category"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Category
            </button>
            <button
              onClick={() => setViewMode("team")}
              title="Group by Team"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === "team"
                  ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              )}
            >
              <Users2 className="w-3.5 h-3.5" />
              Team
            </button>
          </div>

          <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-2 ml-2 space-x-1">
            <button
              onClick={onOpenMappings}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Manage Page Mappings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {(["sessions", "users", "pageviews", "engagement_rate"] as const).map(
            (m) => (
              <button
                key={m}
                onClick={() => setGridMetric(m)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                  gridMetric === m
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50",
                )}
              >
                {m.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider w-80 sticky left-0 bg-gray-50 dark:bg-gray-800 z-40 border-r border-gray-200/60 dark:border-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                {viewMode === "team" ? "Team / Page Name" : "Category / Page Name"}
              </th>
              <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100 bg-blue-50/40 dark:bg-blue-900/20 min-w-[100px]">
                Total
                <br />
                Sessions
              </th>
              <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100 bg-indigo-50/40 dark:bg-indigo-900/20 min-w-[100px]">
                Total
                <br />
                Users
              </th>
              <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100 bg-emerald-50/40 dark:bg-emerald-900/20 min-w-[100px]">
                Total
                <br />
                Views
              </th>
              <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100 bg-amber-50/40 dark:bg-amber-900/20 min-w-[100px]">
                Avg
                <br />
                Eng. Rate
              </th>

              {dateHeaders.map((date) => (
                <th
                  key={date}
                  className="px-6 py-4 text-right font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap min-w-[110px]"
                >
                  {format(parseISO(date), "MMM dd")}
                  <div className="text-[10px] opacity-50 capitalize font-normal mt-0.5">
                    {gridMetric.replace("_", " ")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {groupedData.map(([groupName, groupData], idx) =>
              renderGroupRows(
                groupName,
                groupData,
                viewMode === "team" ? (teamColorIndex[groupName] ?? idx) : idx,
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}