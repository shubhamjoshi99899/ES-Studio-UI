"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenueMetrics, RevenueMetricRow } from "@/lib/api";
import {
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Settings2,
  Download,
  BarChart3,
  Image,
  Film,
  BookOpen,
  Type,
  Gift,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

/* ─── Formatting helper ─── */
function fmt(v: string | number): string {
  const n = Number(v) || 0;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ─── Types ─── */
interface TeamGroup {
  team: string;
  pages: PageRow[];
  totals: SourceTotals;
}

interface PageRow {
  pageName: string;
  bonus: number;
  photo: number;
  reel: number;
  story: number;
  text: number;
  total: number;
}

interface SourceTotals {
  bonus: number;
  photo: number;
  reel: number;
  story: number;
  text: number;
  total: number;
}

/* ─── Chart colours ─── */
const SOURCE_COLORS: Record<string, string> = {
  bonus: "#f59e0b",   // amber
  photo: "#6366f1",   // indigo
  reel: "#ec4899",    // pink
  story: "#14b8a6",   // teal
  text: "#8b5cf6",    // violet
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  bonus: <Gift size={14} />,
  photo: <Image size={14} />,
  reel: <Film size={14} />,
  story: <BookOpen size={14} />,
  text: <Type size={14} />,
};

const SOURCE_LABELS: Record<string, string> = {
  bonus: "Bonus",
  photo: "Photo",
  reel: "Reel",
  story: "Story",
  text: "Text",
};

/* ─── Build team groups from flat rows ─── */
function buildTeamGroups(rows: RevenueMetricRow[]): TeamGroup[] {
  const map = new Map<string, Map<string, SourceTotals>>();

  for (const row of rows) {
    const team = row.team || "Unassigned";
    if (!map.has(team)) map.set(team, new Map());
    const pageMap = map.get(team)!;

    if (!pageMap.has(row.pageName)) {
      pageMap.set(row.pageName, { bonus: 0, photo: 0, reel: 0, story: 0, text: 0, total: 0 });
    }
    const p = pageMap.get(row.pageName)!;
    p.bonus += Number(row.bonus) || 0;
    p.photo += Number(row.photo) || 0;
    p.reel += Number(row.reel) || 0;
    p.story += Number(row.story) || 0;
    p.text += Number(row.text) || 0;
    p.total += Number(row.total) || 0;
  }

  const groups: TeamGroup[] = [];
  for (const [team, pageMap] of map) {
    const pages: PageRow[] = [];
    const totals: SourceTotals = { bonus: 0, photo: 0, reel: 0, story: 0, text: 0, total: 0 };

    for (const [pageName, s] of pageMap) {
      pages.push({ pageName, ...s });
      totals.bonus += s.bonus;
      totals.photo += s.photo;
      totals.reel += s.reel;
      totals.story += s.story;
      totals.text += s.text;
      totals.total += s.total;
    }

    pages.sort((a, b) => b.total - a.total);
    groups.push({ team, pages, totals });
  }

  groups.sort((a, b) => b.totals.total - a.totals.total);
  return groups;
}

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
  };
}

/* ─── CSV Export (pivot form — exactly as shown in the table) ─── */
function exportTableAsCSV(teamGroups: TeamGroup[], grandTotal: SourceTotals, startDate: string, endDate: string) {
  const rows: string[][] = [];

  // Header
  rows.push(["Team / Page", "Bonus", "Photo", "Reel", "Story", "Text", "Total"]);

  for (const group of teamGroups) {
    // Team row
    rows.push([
      group.team,
      group.totals.bonus.toFixed(2),
      group.totals.photo.toFixed(2),
      group.totals.reel.toFixed(2),
      group.totals.story.toFixed(2),
      group.totals.text.toFixed(2),
      group.totals.total.toFixed(2),
    ]);

    // Page rows (indented)
    for (const page of group.pages) {
      rows.push([
        `  ${page.pageName}`,
        page.bonus.toFixed(2),
        page.photo.toFixed(2),
        page.reel.toFixed(2),
        page.story.toFixed(2),
        page.text.toFixed(2),
        page.total.toFixed(2),
      ]);
    }
  }

  // Grand total
  rows.push([
    "Grand Total",
    grandTotal.bonus.toFixed(2),
    grandTotal.photo.toFixed(2),
    grandTotal.reel.toFixed(2),
    grandTotal.story.toFixed(2),
    grandTotal.text.toFixed(2),
    grandTotal.total.toFixed(2),
  ]);

  const csvContent = rows
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `revenue_${startDate}_to_${endDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── Custom Tooltip for Pie Chart ─── */
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-semibold text-gray-900 dark:text-white">{name}</p>
      <p className="text-sm font-bold" style={{ color: inner.fill }}>
        {fmt(value)}
      </p>
      {inner.percent != null && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          {(inner.percent * 100).toFixed(1)}% of total
        </p>
      )}
    </div>
  );
}

/* ─── Custom Tooltip for Bar Chart ─── */
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0);
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 min-w-[160px]">
      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      {payload.map((p: any) =>
        Number(p.value) > 0 ? (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5" style={{ color: p.color }}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(p.value)}</span>
          </div>
        ) : null,
      )}
      <div className="mt-1.5 border-t border-gray-200 dark:border-gray-700 pt-1.5 flex justify-between text-xs font-bold text-gray-900 dark:text-white">
        <span>Total</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}

/* ─── Custom label for Pie ─── */
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.03) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function RevenuePage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ["revenue-metrics", startDate, endDate],
    queryFn: () => fetchRevenueMetrics(startDate, endDate),
    staleTime: 1000 * 60 * 5,
  });

  const teamGroups = useMemo(() => buildTeamGroups(rawRows), [rawRows]);

  const grandTotal = useMemo(() => {
    const t: SourceTotals = { bonus: 0, photo: 0, reel: 0, story: 0, text: 0, total: 0 };
    for (const g of teamGroups) {
      t.bonus += g.totals.bonus;
      t.photo += g.totals.photo;
      t.reel += g.totals.reel;
      t.story += g.totals.story;
      t.text += g.totals.text;
      t.total += g.totals.total;
    }
    return t;
  }, [teamGroups]);

  /* Pie chart data — overall source breakdown */
  const pieData = useMemo(() => {
    const sources = ["bonus", "photo", "reel", "story", "text"] as const;
    return sources
      .map((key) => ({
        name: SOURCE_LABELS[key],
        value: grandTotal[key],
        fill: SOURCE_COLORS[key],
      }))
      .filter((d) => d.value > 0);
  }, [grandTotal]);

  /* Bar chart data — team breakdown by source */
  const barData = useMemo(() => {
    return teamGroups.map((g) => ({
      team: g.team.length > 16 ? g.team.slice(0, 14) + "…" : g.team,
      Bonus: g.totals.bonus,
      Photo: g.totals.photo,
      Reel: g.totals.reel,
      Story: g.totals.story,
      Text: g.totals.text,
    }));
  }, [teamGroups]);

  const toggleTeam = (team: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });
  };

  const expandAll = () => setExpandedTeams(new Set(teamGroups.map((g) => g.team)));
  const collapseAll = () => setExpandedTeams(new Set());

  const handleExport = useCallback(() => {
    exportTableAsCSV(teamGroups, grandTotal, startDate, endDate);
  }, [teamGroups, grandTotal, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Revenue Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Content Monetization — Team & Page Breakdown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isLoading || teamGroups.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
          <Link
            href="/revenue/mappings"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Settings2 size={16} />
            Page Mappings
          </Link>
        </div>
      </div>

      {/* Date Pickers + Summary Cards */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="flex gap-3 flex-wrap">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {fmt(grandTotal.total)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Teams</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {teamGroups.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Pages</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {teamGroups.reduce((sum, g) => sum + g.pages.length, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Charts Section ═══ */}
      {!isLoading && teamGroups.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Donut Chart — Source Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign size={16} className="text-green-500" />
                Revenue by Source
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Revenue distribution across content types
              </p>
            </div>
            <div className="p-4">
              {pieData.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
                  No revenue data to display
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[260px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="value"
                          labelLine={false}
                          label={renderPieLabel}
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-col gap-2 min-w-[130px]">
                    {pieData.map((d) => {
                      const pct = grandTotal.total > 0 ? ((d.value / grandTotal.total) * 100).toFixed(1) : "0";
                      const key = d.name.toLowerCase();
                      return (
                        <div key={d.name} className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: d.fill }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                              {SOURCE_ICONS[key]}
                              {d.name}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {fmt(d.value)} · {pct}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stacked Bar Chart — Team Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-500" />
                Revenue by Team
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Stacked breakdown per team
              </p>
            </div>
            <div className="p-4">
              {barData.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
                  No team data to display
                </div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="team"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        interval={0}
                        angle={barData.length > 4 ? -25 : 0}
                        textAnchor={barData.length > 4 ? "end" : "middle"}
                        height={barData.length > 4 ? 60 : 30}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip content={<BarTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                        iconType="square"
                        iconSize={10}
                      />
                      <Bar dataKey="Bonus" stackId="a" fill={SOURCE_COLORS.bonus} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Photo" stackId="a" fill={SOURCE_COLORS.photo} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Reel" stackId="a" fill={SOURCE_COLORS.reel} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Story" stackId="a" fill={SOURCE_COLORS.story} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Text" stackId="a" fill={SOURCE_COLORS.text} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Source Summary Cards ═══ */}
      {!isLoading && grandTotal.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {(["bonus", "photo", "reel", "story", "text"] as const).map((key) => {
            const val = grandTotal[key];
            const pct = grandTotal.total > 0 ? ((val / grandTotal.total) * 100).toFixed(1) : "0";
            return (
              <div
                key={key}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 group hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: SOURCE_COLORS[key] }}
                  >
                    {SOURCE_ICONS[key]}
                  </span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {SOURCE_LABELS[key]}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {fmt(val)}
                </p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Number(pct), 100)}%`,
                      backgroundColor: SOURCE_COLORS[key],
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {pct}% of total
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isLoading ? "Loading..." : `${rawRows.length} records`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Expand All
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Collapse All
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={handleExport}
              disabled={isLoading || teamGroups.length === 0}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-40 flex items-center gap-1"
            >
              <Download size={12} />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Team / Page
              </th>
              <th className="px-3 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SOURCE_COLORS.bonus }} />
                  Bonus
                </span>
              </th>
              <th className="px-3 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SOURCE_COLORS.photo }} />
                  Photo
                </span>
              </th>
              <th className="px-3 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SOURCE_COLORS.reel }} />
                  Reel
                </span>
              </th>
              <th className="px-3 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SOURCE_COLORS.story }} />
                  Story
                </span>
              </th>
              <th className="px-3 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SOURCE_COLORS.text }} />
                  Text
                </span>
              </th>
              <th className="px-3 py-3 text-right font-medium text-green-600 dark:text-green-400">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    Loading revenue data...
                  </div>
                </td>
              </tr>
            ) : teamGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No revenue data found for the selected date range.
                </td>
              </tr>
            ) : (
              <>
                {teamGroups.map((group) => {
                  const isExpanded = expandedTeams.has(group.team);
                  return (
                    <TeamSection
                      key={group.team}
                      group={group}
                      isExpanded={isExpanded}
                      onToggle={() => toggleTeam(group.team)}
                    />
                  );
                })}
                {/* Grand total row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold dark:border-gray-600 dark:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    Grand Total
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                    {fmt(grandTotal.bonus)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                    {fmt(grandTotal.photo)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                    {fmt(grandTotal.reel)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                    {fmt(grandTotal.story)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                    {fmt(grandTotal.text)}
                  </td>
                  <td className="px-3 py-3 text-right text-green-600 dark:text-green-400">
                    {fmt(grandTotal.total)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        </div>{/* end overflow-x-auto */}
      </div>
    </div>
  );
}

/* ─── Team section sub-component ─── */
function TeamSection({
  group,
  isExpanded,
  onToggle,
}: {
  group: TeamGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {/* Team header row */}
      <tr
        className="cursor-pointer border-b border-gray-100 bg-gray-50/50 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/30 dark:hover:bg-gray-800/60 transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {group.team}
            <span className="text-xs font-normal text-gray-400">
              ({group.pages.length} {group.pages.length === 1 ? "page" : "pages"})
            </span>
          </div>
        </td>
        <td className="px-3 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
          {fmt(group.totals.bonus)}
        </td>
        <td className="px-3 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
          {fmt(group.totals.photo)}
        </td>
        <td className="px-3 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
          {fmt(group.totals.reel)}
        </td>
        <td className="px-3 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
          {fmt(group.totals.story)}
        </td>
        <td className="px-3 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
          {fmt(group.totals.text)}
        </td>
        <td className="px-3 py-3 text-right font-bold text-green-600 dark:text-green-400">
          {fmt(group.totals.total)}
        </td>
      </tr>

      {/* Individual page rows */}
      {isExpanded &&
        group.pages.map((page) => (
          <tr
            key={page.pageName}
            className="border-b border-gray-50 hover:bg-gray-50/50 dark:border-gray-800/50 dark:hover:bg-gray-800/20 transition-colors"
          >
            <td className="py-2.5 pl-12 pr-4 text-gray-600 dark:text-gray-400">
              {page.pageName}
            </td>
            <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">
              {fmt(page.bonus)}
            </td>
            <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">
              {fmt(page.photo)}
            </td>
            <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">
              {fmt(page.reel)}
            </td>
            <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">
              {fmt(page.story)}
            </td>
            <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">
              {fmt(page.text)}
            </td>
            <td className="px-3 py-2.5 text-right font-medium text-green-600 dark:text-green-400">
              {fmt(page.total)}
            </td>
          </tr>
        ))}
    </>
  );
}
