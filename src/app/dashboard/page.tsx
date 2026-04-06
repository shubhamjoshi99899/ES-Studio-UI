"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  Download,
  MoreHorizontal,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { fetchHeadlines } from "@/lib/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [gaData, setGaData] = useState<any>(null);
  const [metaData, setMetaData] = useState<any>(null);

  const [dateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      try {
        const headlines = await fetchHeadlines();
        if (headlines) setGaData(headlines);

        const profileRes = await fetch(
          `${BACKEND_URL}/api/analytics/profiles/list`,
          {
            credentials: "include",
          },
        );

        if (profileRes.ok) {
          const profiles = await profileRes.json();
          if (Array.isArray(profiles) && profiles.length > 0) {
            const profileIds = profiles.map((p: any) => p.profileId);

            const aggRes = await fetch(
              `${BACKEND_URL}/api/analytics/aggregate`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  profileIds,
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                }),
              },
            );

            if (aggRes.ok) {
              const aggData = await aggRes.json();
              setMetaData(aggData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange.startDate, dateRange.endDate]);

  const MetricCard = ({ title, value, change, link, suffix = "" }: any) => {
    const isPositive = Number(change) >= 0;
    return (
      <Link
        href={link}
        className="block group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-md transition-all relative overflow-hidden"
      >
        <ArrowUpRight
          className="absolute top-4 right-4 text-gray-300 dark:text-gray-600 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
          size={20}
        />
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-end justify-between">
            <p className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {value !== undefined
                ? `${Number(value).toLocaleString()}${suffix}`
                : "..."}
            </p>
            {change !== undefined && (
              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isPositive
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(Number(change))}%
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  const upcomingPosts = [
    {
      id: 1,
      title: "Product launch announcement - Phase 1",
      time: "Tomorrow at 10:00 AM",
      platform: "Instagram",
      image:
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=100&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Customer testimonial spotlight",
      time: "Oct 14 at 2:30 PM",
      platform: "Facebook",
      image:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=100&auto=format&fit=crop",
    },
  ];

  const recentReports = [
    {
      id: 1,
      name: "September_Audit_Final.pdf",
      meta: "2 days ago • 4.2 MB",
      type: "pdf",
    },
    {
      id: 2,
      name: "Weekly_Performance_V2.csv",
      meta: "5 days ago • 1.1 MB",
      type: "csv",
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time performance across your connected platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Calendar size={16} className="text-gray-400" />
            Last 30 days
            <ChevronDown size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col gap-3 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <div className="text-gray-500 dark:text-gray-400 font-medium">
            Gathering command center data...
          </div>
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Web Traffic Overview
              </h2>
              <Link
                href="/traffic"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                View Analytics →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MetricCard
                title="Daily Sessions (Yesterday)"
                value={gaData?.daily?.sessions || 0}
                change={gaData?.daily?.diff || 0}
                link="/traffic"
              />
              <MetricCard
                title="Weekly Sessions (Last 7 Days)"
                value={gaData?.weekly?.sessions || 0}
                change={gaData?.weekly?.diff || 0}
                link="/traffic"
              />
            </div>
          </div>

          <div className="h-px w-full bg-gray-200 dark:bg-gray-800 my-2"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Social Media Overview (30 Days)
              </h2>
              <Link
                href="/reports"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                View Reports →
              </Link>
            </div>

            {metaData?.totals ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <MetricCard
                  title="Total Audience"
                  value={metaData.totals.currentAudience}
                  change={metaData.totals.audienceChange}
                  link="/reports"
                />
                <MetricCard
                  title="Net Followers"
                  value={metaData.totals.netGrowth}
                  change={metaData.totals.growthChange}
                  link="/reports"
                />
                <MetricCard
                  title="Impressions / Reach"
                  value={metaData.totals.impressions}
                  change={metaData.totals.impressionsChange}
                  link="/reports"
                />
                <MetricCard
                  title="Total Engagements"
                  value={metaData.totals.engagements}
                  change={metaData.totals.engagementsChange}
                  link="/reports"
                />
                <MetricCard
                  title="Engagement Rate"
                  value={metaData.totals.engagementRate}
                  change={metaData.totals.engagementRateChange}
                  link="/reports"
                  suffix="%"
                />
                <MetricCard
                  title="Page Views"
                  value={metaData.totals.pageViews}
                  change={metaData.totals.pageViewsChange}
                  link="/reports"
                />
                <MetricCard
                  title="Video Views"
                  value={metaData.totals.videoViews}
                  change={metaData.totals.videoViewsChange}
                  link="/reports"
                />
                <MetricCard
                  title="Net Messages"
                  value={metaData.totals.messages}
                  change={metaData.totals.messagesChange}
                  link="/reports"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No social data available.
                </p>
                <Link
                  href="/settings"
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Connect accounts in Settings
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-4">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Upcoming Scheduled Posts
                </h2>
                <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700">
                  Calendar
                </button>
              </div>
              <div className="space-y-4">
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between rounded-xl border border-gray-50 dark:border-gray-800/50 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={post.image}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {post.time} • {post.platform}
                        </p>
                      </div>
                    </div>
                    <MoreHorizontal
                      size={20}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Recent Exports
                </h2>
                <button className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Archive
                </button>
              </div>
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-xl border border-gray-50 dark:border-gray-800/50 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        {report.type === "pdf" ? (
                          <FileText size={20} />
                        ) : (
                          <FileSpreadsheet size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {report.meta}
                        </p>
                      </div>
                    </div>
                    <Download
                      size={18}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
