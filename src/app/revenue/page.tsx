"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  Search,
  CheckSquare,
  Square,
  Filter,
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
  LineChart,
  Line,
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

/* ─── Distinct color palette for line charts ─── */
const LINE_COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#84cc16", "#f97316", "#a855f7",
  "#10b981", "#e11d48", "#0ea5e9", "#eab308", "#d946ef",
  "#22d3ee", "#fb923c", "#4ade80", "#f43f5e", "#818cf8",
];

/* ─── Build daily progression data ─── */
function buildDailyProgression(
  rows: RevenueMetricRow[],
  groupBy: "team" | "pageName",
): { chartData: Record<string, string | number>[]; keys: string[] } {
  const dateMap = new Map<string, Map<string, number>>();
  const allKeys = new Set<string>();

  for (const row of rows) {
    const key = groupBy === "team" ? (row.team || "Unassigned") : row.pageName;
    allKeys.add(key);
    if (!dateMap.has(row.date)) dateMap.set(row.date, new Map());
    const dayMap = dateMap.get(row.date)!;
    dayMap.set(key, (dayMap.get(key) || 0) + (Number(row.total) || 0));
  }

  const sortedDates = Array.from(dateMap.keys()).sort();
  const chartData = sortedDates.map((date) => {
    const dayMap = dateMap.get(date)!;
    
    // Format date as dd.mm.yyyy in IST
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, ".");

    const entry: Record<string, string | number> = {
      date: formattedDate,
    };
    for (const key of allKeys) {
      entry[key] = Math.round((dayMap.get(key) || 0) * 100) / 100;
    }
    return entry;
  });

  // Sort keys by total descending for legend ordering
  const keyTotals = new Map<string, number>();
  for (const key of allKeys) {
    keyTotals.set(key, chartData.reduce((s, d) => s + (Number(d[key]) || 0), 0));
  }
  const keys = Array.from(allKeys).sort((a, b) => (keyTotals.get(b) || 0) - (keyTotals.get(a) || 0));

  return { chartData, keys };
}

/* ─── Custom Tooltip for Line Charts (all lines) ─── */
function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a: any, b: any) => (Number(b.value) || 0) - (Number(a.value) || 0));
  const total = sorted.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0);
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 min-w-[180px] max-h-[320px] overflow-y-auto">
      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      {sorted.map((p: any) =>
        Number(p.value) > 0 ? (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 truncate max-w-[140px]" style={{ color: p.color }}>
              <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              {p.dataKey}
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

/* ─── Custom Tooltip for Page-Wise Line Chart (single hovered line only) ─── */
function SingleLineTooltip({ active, payload, label, hoveredKey }: any) {
  if (!active || !payload?.length || !hoveredKey) return null;
  const entry = payload.find((p: any) => p.dataKey === hoveredKey);
  if (!entry || !Number(entry.value)) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-lg dark:border-gray-700 dark:bg-gray-800 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-xs font-semibold truncate max-w-[160px]" style={{ color: entry.color }}>
          {entry.dataKey}
        </span>
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{fmt(entry.value)}</p>
    </div>
  );
}

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
      // Skip pages that earned nothing in the selected range — the table should
      // only surface pages with non-zero revenue.
      if ((Number(s.total) || 0) <= 0) continue;
      pages.push({ pageName, ...s });
      totals.bonus += s.bonus;
      totals.photo += s.photo;
      totals.reel += s.reel;
      totals.story += s.story;
      totals.text += s.text;
      totals.total += s.total;
    }

    // Drop entire team group if no page survived the zero-revenue filter.
    if (pages.length === 0) continue;

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
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [isPageFilterOpen, setIsPageFilterOpen] = useState(false);
  const [pageSearchQuery, setPageSearchQuery] = useState("");
  const [hoveredPageKey, setHoveredPageKey] = useState<string | null>(null);
  const pageFilterRef = useRef<HTMLDivElement>(null);

  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ["revenue-metrics", startDate, endDate],
    queryFn: () => fetchRevenueMetrics(startDate, endDate),
    staleTime: 1000 * 60 * 5,
  });

  /* Derive all unique page names from the data, EXCLUDING pages whose total
   * revenue across the range is zero — those pages should not appear anywhere
   * in the revenue view (table, page filter, charts). */
  const allPageNames = useMemo(() => {
    const totalByPage = new Map<string, number>();
    for (const row of rawRows) {
      totalByPage.set(
        row.pageName,
        (totalByPage.get(row.pageName) || 0) + (Number(row.total) || 0),
      );
    }
    return Array.from(totalByPage.entries())
      .filter(([, total]) => total > 0)
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));
  }, [rawRows]);

  /* Auto-select all pages when data first loads or data changes */
  useEffect(() => {
    if (allPageNames.length > 0 && selectedPages.size === 0) {
      setSelectedPages(new Set(allPageNames));
    }
  }, [allPageNames]);

  /* Close page filter dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pageFilterRef.current && !pageFilterRef.current.contains(e.target as Node)) {
        setIsPageFilterOpen(false);
        setPageSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Filter rows by selected pages */
  const filteredRows = useMemo(() => {
    if (selectedPages.size === 0 || selectedPages.size === allPageNames.length) return rawRows;
    return rawRows.filter((row) => selectedPages.has(row.pageName));
  }, [rawRows, selectedPages, allPageNames.length]);

  const teamGroups = useMemo(() => buildTeamGroups(filteredRows), [filteredRows]);

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

  /* Daily progression — team-wise */
  const teamProgression = useMemo(() => buildDailyProgression(filteredRows, "team"), [filteredRows]);
  /* Daily progression — page-wise */
  const pageProgression = useMemo(() => buildDailyProgression(filteredRows, "pageName"), [filteredRows]);

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

  /* Page filter helpers */
  const filteredPageNames = useMemo(() => {
    if (!pageSearchQuery) return allPageNames;
    const q = pageSearchQuery.toLowerCase();
    return allPageNames.filter((name) => name.toLowerCase().includes(q));
  }, [allPageNames, pageSearchQuery]);

  const isAllPagesSelected = selectedPages.size === allPageNames.length;

  const togglePageSelection = (pageName: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageName)) next.delete(pageName);
      else next.add(pageName);
      return next;
    });
  };

  const toggleSelectAllPages = () => {
    if (isAllPagesSelected) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(allPageNames));
    }
  };

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

      {/* Date Pickers + Page Filter + Summary Cards */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
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

          {/* Page Filter Dropdown */}
          <div className="relative" ref={pageFilterRef}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Pages
            </label>
            <button
              onClick={() => setIsPageFilterOpen(!isPageFilterOpen)}
              className="flex items-center justify-between min-w-[220px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="flex items-center gap-2 truncate pr-2">
                <Filter size={14} className="text-gray-400 flex-shrink-0" />
                {selectedPages.size === 0
                  ? "Select Pages..."
                  : isAllPagesSelected
                    ? `All Pages (${allPageNames.length})`
                    : `${selectedPages.size} of ${allPageNames.length} Pages`}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 flex-shrink-0 transition-transform ${isPageFilterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isPageFilterOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search pages..."
                      value={pageSearchQuery}
                      onChange={(e) => setPageSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow text-gray-700 dark:text-gray-200"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Select All */}
                {filteredPageNames.length > 0 && (
                  <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <button
                      onClick={toggleSelectAllPages}
                      className="flex items-center gap-2 w-full px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {isAllPagesSelected ? (
                        <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square size={16} className="text-gray-400 dark:text-gray-500" />
                      )}
                      {isAllPagesSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                )}

                {/* Page List */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredPageNames.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                      No pages found
                    </div>
                  ) : (
                    filteredPageNames.map((pageName) => {
                      const isSelected = selectedPages.has(pageName);
                      return (
                        <button
                          key={pageName}
                          onClick={() => togglePageSelection(pageName)}
                          className={`flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                            isSelected
                              ? "bg-indigo-50/50 dark:bg-indigo-900/20 text-gray-900 dark:text-white font-semibold"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare
                              size={16}
                              className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                            />
                          ) : (
                            <Square
                              size={16}
                              className="text-gray-300 dark:text-gray-600 flex-shrink-0"
                            />
                          )}
                          <span className="truncate">{pageName}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
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

      {/* ═══ Daily Revenue Progression ═══ */}
      {!isLoading && teamProgression.chartData.length > 1 && (
        <div className="grid grid-cols-1 gap-4">
          {/* Team-wise daily progression */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" />
                Daily Revenue — Team Wise
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Total revenue per day, split by team
              </p>
            </div>
            <div className="p-4">
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={teamProgression.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip content={<LineTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="plainline" iconSize={14} />
                    {teamProgression.keys.map((key, i) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={teamProgression.chartData.length <= 15 ? { r: 3 } : false}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Page-wise daily progression */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-500" />
                Daily Revenue — Page Wise
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Total revenue per day, split by page — <span className="italic">hover over lines to see page names</span>
              </p>
            </div>
            <div className="p-4">
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={pageProgression.chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                    onMouseLeave={() => setHoveredPageKey(null)}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip 
                      isAnimationActive={false} 
                      content={(props: any) => <SingleLineTooltip {...props} hoveredKey={hoveredPageKey} />} 
                    />
                    
                    {/* Actual visible lines */}
                    {pageProgression.keys.map((key, i) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={hoveredPageKey === key ? 3 : hoveredPageKey === null ? 2 : 1}
                        strokeOpacity={hoveredPageKey === null || hoveredPageKey === key ? 1 : 0.15}
                        dot={false}
                        activeDot={hoveredPageKey === key ? { r: 6, strokeWidth: 2, stroke: "#fff" } : false}
                        isAnimationActive={false}
                      />
                    ))}

                    {/* Invisible hit-area lines for much easier hovering */}
                    {pageProgression.keys.map((key) => (
                      <Line
                        key={`${key}-hover`}
                        type="monotone"
                        dataKey={key}
                        stroke="transparent"
                        strokeWidth={35}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                        onMouseEnter={() => setHoveredPageKey(key)}
                        onMouseLeave={() => setHoveredPageKey(null)}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
            {isLoading ? "Loading..." : `${filteredRows.length} records${selectedPages.size < allPageNames.length ? ` (${selectedPages.size} pages)` : ""}`}
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
