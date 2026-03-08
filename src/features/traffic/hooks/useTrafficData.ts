import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAnalyticsData,
  fetchHeadlines,
  processDataForDashboard,
  fetchPageMappings,
  triggerManualSync,
} from "@/lib/api";
import {
  format, subDays, eachDayOfInterval, parseISO, startOfWeek,
  startOfMonth, isBefore, subWeeks, startOfToday,
} from "date-fns";

export function useTrafficData() {
  const queryClient = useQueryClient();

  const getSmartStartDate = () => {
    const yesterday = subDays(new Date(), 1);
    const weekStart = startOfWeek(yesterday, { weekStartsOn: 1 });
    const monthStart = startOfMonth(yesterday);
    return isBefore(weekStart, monthStart) ? monthStart : weekStart;
  };

  // 1. Local Filter State
  const [platform, setPlatform] = useState<"Facebook" | "Threads">("Facebook");
  const [startDate, setStartDate] = useState(format(getSmartStartDate(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(subDays(new Date(), 1), "yyyy-MM-dd"));
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");

  const utmSource = platform === "Facebook" ? "fb" : "threads";

  // 2. React Query: Fetch Mappings (Cached globally)
  const { data: mappings = [], isLoading: loadingMappings } = useQuery({
    queryKey: ["mappings"],
    queryFn: fetchPageMappings,
    staleTime: 1000 * 60 * 60, // Mappings rarely change, cache for an hour
  });

  // 3. React Query: Fetch Headlines
  const { data: headlines = null, isLoading: loadingHeadlines } = useQuery({
    queryKey: ["headlines", utmSource],
    queryFn: () => fetchHeadlines(utmSource),
  });

  // 4. React Query: Fetch Raw Analytics Data
  const { 
    data: rawData = [], 
    isLoading: loadingData,
    refetch: refreshAnalytics
  } = useQuery({
    queryKey: ["analytics", utmSource, startDate, endDate],
    queryFn: () => fetchAnalyticsData(startDate, endDate, utmSource),
    // Query only runs if we have start and end dates
    enabled: !!startDate && !!endDate,
  });

  // 5. React Query: Mutation for Manual Sync
  const syncMutation = useMutation({
    mutationFn: triggerManualSync,
    onSuccess: () => {
      // Invalidate the cache to trigger a fresh background fetch automatically
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["headlines"] });
    },
    onError: () => {
      alert("Failed to sync BigQuery data. Check console for details.");
    }
  });

  // 6. Derived Data (Only recalculates if rawData, platform, or selectedCampaign changes)
  const data = useMemo(() => {
    if (!rawData.length) return [];
    const processed = processDataForDashboard(rawData, platform, selectedCampaign, mappings);
    return processed.sort((a, b) => b.totals.sessions - a.totals.sessions);
  }, [rawData, platform, selectedCampaign, mappings]);

  // 7. Filter Handlers
  const applyPreset = (preset: "30days" | "prevWeek" | "thisMonth" | "last7Days") => {
    const yesterday = subDays(startOfToday(), 1);
    let newStart;
    let newEnd = yesterday;

    switch (preset) {
      case "last7Days": newStart = subDays(yesterday, 6); break;
      case "30days": newStart = subDays(yesterday, 29); break;
      case "prevWeek": newStart = subWeeks(startOfWeek(yesterday, { weekStartsOn: 1 }), 1); break;
      case "thisMonth": newStart = startOfMonth(yesterday); break;
    }

    if (newStart && newStart > newEnd) newStart = newEnd;
    setStartDate(format(newStart!, "yyyy-MM-dd"));
    setEndDate(format(newEnd, "yyyy-MM-dd"));
  };

  const resetFilters = () => {
    setStartDate(format(getSmartStartDate(), "yyyy-MM-dd"));
    setEndDate(format(subDays(new Date(), 1), "yyyy-MM-dd"));
    setSelectedCampaign("");
  };

  // 8. Options and Stats
  const dateHeaders = useMemo(() => {
    try {
      const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
      return days.reverse().map((d) => format(d, "yyyy-MM-dd"));
    } catch {
      return [];
    }
  }, [startDate, endDate]);

  const availableCampaigns = useMemo(() => {
    return Array.from(new Set(rawData.map((r) => r.utm_campaign).filter(Boolean))).sort();
  }, [rawData]);

  const stats = useMemo(() => {
    return data.reduce((acc, curr) => ({
      sessions: acc.sessions + curr.totals.sessions,
      users: acc.users + curr.totals.users,
      pageviews: acc.pageviews + curr.totals.pageviews,
      engagement: acc.engagement + curr.totals.engagement_rate_avg,
      recurring_users: acc.recurring_users + curr.totals.recurring_users,
      identified_users: acc.identified_users + curr.totals.identified_users,
    }), { sessions: 0, users: 0, pageviews: 0, engagement: 0, recurring_users: 0, identified_users: 0 });
  }, [data]);

  const loading = loadingData || loadingHeadlines || loadingMappings;

  return {
    data,
    rawData,
    headlines,
    loading,
    filters: {
      platform, setPlatform, startDate, setStartDate, endDate, setEndDate,
      selectedCampaign, setSelectedCampaign, applyPreset, resetFilters,
    },
    options: { dateHeaders, availableCampaigns },
    stats,
    refresh: refreshAnalytics,
    sync: { 
      isSyncing: syncMutation.isPending, 
      handleSync: () => syncMutation.mutate() 
    },
  };
}