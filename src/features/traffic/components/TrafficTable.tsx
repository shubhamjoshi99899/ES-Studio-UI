import { useState, useMemo } from "react";
import { AggregatedPageData } from "@/types";
import { format, parseISO } from "date-fns";
import { BarChart3, Settings, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TrafficTableProps {
  data: AggregatedPageData[];
  dateHeaders: string[];
}

type MetricType = "sessions" | "users" | "pageviews" | "engagement_rate";

export function TrafficTable({ data, dateHeaders }: TrafficTableProps) {
  const [gridMetric, setGridMetric] = useState<MetricType>("sessions");

  const groupedData = useMemo(() => {
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

  const getMetricForDate = (row: AggregatedPageData, dateStr: string) => {
    const dayData = row.dailyTrend.find((d) => d.date === dateStr);
    if (!dayData) return 0;
    if (gridMetric === "engagement_rate")
      return (dayData.engagement_rate * 100).toFixed(1) + "%";
    return dayData[gridMetric] || 0;
  };

  const getCategoryMetricForDate = (
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

  const handleExportCSV = () => {
    if (!groupedData.length) return;

    const headers = [
      "Category",
      "Page Name",
      "Total Sessions",
      "Total Users",
      "Total Pageviews",
      "Avg Engagement Rate",
      ...dateHeaders.map((d) => `${d} (${gridMetric})`),
    ];

    const csvRows = [headers.join(",")];

    groupedData.forEach(([category, { rows }]) => {
      rows.forEach((row) => {
        const rowData = [
          `"${category}"`,
          `"${row.pageName}"`,
          row.totals.sessions,
          row.totals.users,
          row.totals.pageviews,
          `"${(row.totals.engagement_rate_avg * 100).toFixed(2)}%"`,
        ];

        dateHeaders.forEach((date) => {
          const dayData = row.dailyTrend.find((d) => d.date === date);
          if (!dayData) {
            rowData.push("0");
          } else {
            if (gridMetric === "engagement_rate") {
              rowData.push(`"${(dayData.engagement_rate * 100).toFixed(1)}%"`);
            } else {
              rowData.push(String(dayData[gridMetric] || 0));
            }
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
      `traffic_export_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm z-20 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
            Detailed Breakdown
          </h3>

          <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-2 ml-2 space-x-1">
            <Link
              href="/traffic/mappings"
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Manage Page Mappings"
            >
              <Settings className="w-4 h-4" />
            </Link>
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
                Page Name
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
            {groupedData.map(([category, { rows, totals, dailyTotals }]) => (
              <>
                {/* Category Header */}
                <tr
                  key={category}
                  className="bg-gray-100 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700"
                >
                  <td className="px-6 py-4 sticky left-0 bg-gray-100 dark:bg-gray-800 z-20 border-r border-gray-200/60 dark:border-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-800 dark:text-gray-200 text-base uppercase tracking-wide">
                        {category}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-bold">
                        {rows.length}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200 bg-gray-100/50 dark:bg-gray-800/50">
                    {totals.sessions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200 bg-gray-100/50 dark:bg-gray-800/50">
                    {totals.users.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200 bg-gray-100/50 dark:bg-gray-800/50">
                    {totals.pageviews.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-200 bg-gray-100/50 dark:bg-gray-800/50">
                    {(
                      (totals.engagement_sum / (totals.count || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </td>

                  {dateHeaders.map((date) => {
                    const val = getCategoryMetricForDate(dailyTotals, date);
                    const isZero = val === 0 || val === "0.0%";
                    return (
                      <td
                        key={date}
                        className={`px-6 py-4 text-right font-bold text-gray-800 dark:text-gray-300 bg-gray-200/50 dark:bg-gray-700/30 tabular-nums border-l border-dashed border-gray-300/50 dark:border-gray-700 ${isZero ? "text-gray-400 dark:text-gray-600" : ""}`}
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
                      <div className="truncate w-72" title={row.pageName}>
                        {row.pageName}
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
                          className={`px-6 py-4 text-right tabular-nums border-l border-dashed border-gray-100 dark:border-gray-800 ${isZero ? "text-gray-300 dark:text-gray-700" : "text-gray-700 dark:text-gray-300"}`}
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
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
