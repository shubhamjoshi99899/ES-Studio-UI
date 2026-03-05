import { useState, useEffect, useMemo } from "react";
import {
  fetchAnalyticsData,
  fetchHeadlines,
  processDataForDashboard,
  fetchPageMappings,
  triggerManualSync,
} from "@/lib/api";
import { AggregatedPageData, BackendMetric, HeadlineData } from "@/types";
import { MappingEntry } from "@/data/page-mapping";
import {
  format,
  subDays,
  eachDayOfInterval,
  parseISO,
  startOfWeek,
  startOfMonth,
  isBefore,
  subWeeks,
  startOfToday,
} from "date-fns";

export function useTrafficData() {
  const [data, setData] = useState<AggregatedPageData[]>([]);
  const [rawData, setRawData] = useState<BackendMetric[]>([]);
  const [headlines, setHeadlines] = useState<HeadlineData | null>(null);
  const [mappings, setMappings] = useState<MappingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const getSmartStartDate = () => {
    const yesterday = subDays(new Date(), 1);

    const weekStart = startOfWeek(yesterday, { weekStartsOn: 1 });
    const monthStart = startOfMonth(yesterday);

    return isBefore(weekStart, monthStart) ? monthStart : weekStart;
  };

  const [platform, setPlatform] = useState<"Facebook" | "Threads">("Facebook");

  const [startDate, setStartDate] = useState(
    format(getSmartStartDate(), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(
    format(subDays(new Date(), 1), "yyyy-MM-dd"),
  );

  const [selectedCampaign, setSelectedCampaign] = useState<string>("");

  const applyPreset = (
    preset: "30days" | "prevWeek" | "thisMonth" | "last7Days",
  ) => {
    const yesterday = subDays(startOfToday(), 1);

    let newStart;
    let newEnd = yesterday;

    switch (preset) {
      case "last7Days":
        newStart = subDays(yesterday, 6);
        break;
      case "30days":
        newStart = subDays(yesterday, 29);
        break;
      case "prevWeek":
        newStart = subWeeks(startOfWeek(yesterday, { weekStartsOn: 1 }), 1);
        break;
      case "thisMonth":
        newStart = startOfMonth(yesterday);
        break;
    }

    if (newStart && newStart > newEnd) {
      newStart = newEnd;
    }

    setStartDate(format(newStart!, "yyyy-MM-dd"));
    setEndDate(format(newEnd, "yyyy-MM-dd"));
  };

  const resetFilters = () => {
    setStartDate(format(getSmartStartDate(), "yyyy-MM-dd"));
    setEndDate(format(subDays(new Date(), 1), "yyyy-MM-dd"));
    setSelectedCampaign("");
  };

  const loadData = async () => {
    setLoading(true);
    const utmSource = platform === "Facebook" ? "fb" : "threads";

    const [fetchedRaw, fetchedHeadlines, fetchedMappings] = await Promise.all([
      fetchAnalyticsData(startDate, endDate, utmSource),
      fetchHeadlines(utmSource),
      fetchPageMappings(),
    ]);

    setRawData(fetchedRaw);
    setHeadlines(fetchedHeadlines);
    setMappings(fetchedMappings);

    const processed = processDataForDashboard(
      fetchedRaw,
      platform,
      selectedCampaign,
      fetchedMappings,
    );
    processed.sort((a, b) => b.totals.sessions - a.totals.sessions);
    setData(processed);

    setLoading(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerManualSync();
      await loadData();
    } catch (error) {
      console.error("Failed to sync data");
      alert("Failed to sync BigQuery data. Check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [platform, startDate, endDate]);

  useEffect(() => {
    if (rawData.length > 0) {
      const processed = processDataForDashboard(
        rawData,
        platform,
        selectedCampaign,
        mappings,
      );
      processed.sort((a, b) => b.totals.sessions - a.totals.sessions);
      setData(processed);
    } else {
      setData([]);
    }
  }, [selectedCampaign, platform, rawData, mappings]);

  const dateHeaders = useMemo(() => {
    try {
      const days = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      });
      return days.reverse().map((d) => format(d, "yyyy-MM-dd"));
    } catch {
      return [];
    }
  }, [startDate, endDate]);

  const availableCampaigns = useMemo(() => {
    const campaigns = new Set(
      rawData.map((r) => r.utm_campaign).filter(Boolean),
    );
    return Array.from(campaigns).sort();
  }, [rawData]);

  const globalStats = useMemo(() => {
    return data.reduce(
      (acc, curr) => ({
        sessions: acc.sessions + curr.totals.sessions,
        users: acc.users + curr.totals.users,
        pageviews: acc.pageviews + curr.totals.pageviews,
        engagement: acc.engagement + curr.totals.engagement_rate_avg,
        recurring_users: acc.recurring_users + curr.totals.recurring_users,
        identified_users: acc.identified_users + curr.totals.identified_users,
      }),
      {
        sessions: 0,
        users: 0,
        pageviews: 0,
        engagement: 0,
        recurring_users: 0,
        identified_users: 0,
      },
    );
  }, [data]);

  return {
    data,
    rawData,
    headlines,
    loading,
    filters: {
      platform,
      setPlatform,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      selectedCampaign,
      setSelectedCampaign,
      applyPreset,
      resetFilters,
    },
    options: { dateHeaders, availableCampaigns },
    stats: globalStats,
    refresh: loadData,
    sync: { isSyncing, handleSync },
  };
}
