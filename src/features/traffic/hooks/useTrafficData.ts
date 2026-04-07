import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAggregatedData,
  fetchAvailableCampaigns,
  fetchHeadlines,
  fetchCountryStats,
  processAggregatedData,
  fetchPageMappings,
  triggerManualSync,
} from "@/lib/api";
import {
  format, subDays, eachDayOfInterval, parseISO, startOfWeek,
  startOfMonth, subWeeks, startOfToday,
} from "date-fns";

export function useTrafficData() {
  const queryClient = useQueryClient();

  // 1. Local Filter State
  const [platform, setPlatform] = useState<"Facebook" | "Threads">("Facebook");
  const [startDate, setStartDate] = useState(format(subDays(subDays(new Date(), 1), 6), "yyyy-MM-dd"));
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
  const { data: headlines = null, isLoading: loadingHeadlines, isFetching: fetchingHeadlines } = useQuery({
    queryKey: ["headlines", utmSource],
    queryFn: () => fetchHeadlines(utmSource),
  });

  // 4. React Query: Fetch Aggregated Analytics Data (OPTIMIZED)
  // Uses new endpoint that groups by (date, utmMedium) server-side
  // Campaign filter is passed to server to avoid fetching unnecessary data
  const {
    data: rawData = [],
    isLoading: loadingData,
    isFetching: fetchingData,
  } = useQuery({
    queryKey: ["analytics-aggregated", utmSource, startDate, endDate, selectedCampaign],
    queryFn: () => fetchAggregatedData(startDate, endDate, utmSource, selectedCampaign || undefined),
    enabled: !!startDate && !!endDate,
  });

  // 4b. React Query: Fetch Country Stats (lightweight, separate from main data)
  const { data: countryStats = [], isFetching: fetchingCountry } = useQuery({
    queryKey: ["countryStats", utmSource, startDate, endDate],
    queryFn: () => fetchCountryStats(startDate, endDate, utmSource),
    enabled: !!startDate && !!endDate,
  });

  // 4c. React Query: Fetch available campaigns (lightweight, separate query)
  const { data: availableCampaigns = [], isFetching: fetchingCampaigns } = useQuery({
    queryKey: ["campaigns", utmSource, startDate, endDate],
    queryFn: () => fetchAvailableCampaigns(startDate, endDate, utmSource),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // Cache campaign list for 5 min
  });

  // 5. React Query: Mutation for Manual Sync
  const syncMutation = useMutation({
    mutationFn: triggerManualSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-aggregated"] });
      queryClient.invalidateQueries({ queryKey: ["countryStats"] });
      queryClient.invalidateQueries({ queryKey: ["headlines"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => {
      alert("Failed to sync BigQuery data. Check console for details.");
    }
  });

  // 6. Derived Data (Only recalculates if rawData or selectedCampaign changes)
  const data = useMemo(() => {
    if (!rawData.length) return [];
    const processed = processAggregatedData(rawData, selectedCampaign, mappings);
    return processed.sort((a, b) => b.totals.sessions - a.totals.sessions);
  }, [rawData, selectedCampaign, mappings]);

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
    const yesterday = subDays(new Date(), 1);
    setStartDate(format(subDays(yesterday, 6), "yyyy-MM-dd"));
    setEndDate(format(yesterday, "yyyy-MM-dd"));
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

  const loading = loadingData || loadingHeadlines || loadingMappings || fetchingData || fetchingHeadlines || fetchingCountry || fetchingCampaigns;

  return {
    data,
    rawData,
    countryStats,
    headlines,
    loading,
    filters: {
      platform, setPlatform, startDate, setStartDate, endDate, setEndDate,
      selectedCampaign, setSelectedCampaign, applyPreset, resetFilters,
    },
    options: { dateHeaders, availableCampaigns },
    stats,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-aggregated"] });
      queryClient.invalidateQueries({ queryKey: ["headlines"] });
      queryClient.invalidateQueries({ queryKey: ["countryStats"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    sync: {
      isSyncing: syncMutation.isPending,
      handleSync: () => syncMutation.mutate(),
    },
  };
}