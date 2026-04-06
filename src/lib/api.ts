import axios from "axios";
import { MappingEntry } from "../data/page-mapping";
import { AggregatedPageData, AggregatedMetric, BackendMetric, CountryStat, HeadlineData } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const API_BASE_URL = `/v1/analytics`;
const MAPPINGS_URL = `/page-mappings`;
const REVENUE_URL = `/v1/revenue`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "x-api-key": process.env.NEXT_PUBLIC_ANALYTICS_API_KEY || "",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      // Skip redirect for auth-check calls (useAuth hook) and login/logout
      const isAuthCheck = url.includes("/sync-status") || url.includes("/auth/login") || url.includes("/auth/logout");
      if (!isAuthCheck && typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export async function loginUser(email: string, password: string) {
  const response = await apiClient.post("/api/auth/login", { email, password });
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post("/api/auth/logout");
  return response.data;
}

interface PageInfo {
  pageName: string;
  category: string;
  team?: string | null;
}
export async function fetchPageMappings(): Promise<MappingEntry[]> {
  try {
    const response = await apiClient.get(MAPPINGS_URL);
    return response.data;
  } catch (error) {
    console.error("Mapping Fetch Error:", error);
    return [];
  }
}

export async function importPageMappingsCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post(`${MAPPINGS_URL}/import`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function importLegacyDataCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post(
    `${API_BASE_URL}/import/legacy`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function createPageMapping(mapping: MappingEntry) {
  return apiClient.post(MAPPINGS_URL, mapping);
}

export async function deletePageMapping(id: number) {
  return apiClient.delete(`${MAPPINGS_URL}/${id}`);
}

export async function updatePageMapping(id: number, mapping: Partial<MappingEntry>) {
  return apiClient.patch(`${MAPPINGS_URL}/${id}`, mapping);
}

export async function fetchHeadlines(
  source?: string,
): Promise<HeadlineData | null> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/headlines`, {
      params: { utmSource: source },
    });
    return response.data;
  } catch (error) {
    console.error("Headlines Error:", error);
    return null;
  }
}

export async function triggerManualSync() {
  try {
    const response = await apiClient.post(`${API_BASE_URL}/sync/manual`);
    return response.data;
  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
}

export async function fetchCountryStats(
  startDate: string,
  endDate: string,
  source: string,
): Promise<CountryStat[]> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/country-stats`, {
      params: { startDate, endDate, utmSource: source },
    });
    return response.data;
  } catch (error) {
    console.error("Country Stats Error:", error);
    return [];
  }
}

export async function fetchAnalyticsData(
  startDate: string,
  endDate: string,
  source: string,
): Promise<BackendMetric[]> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/utm/metrics`, {
      params: {
        rollup: "daily",
        startDate,
        endDate,
        utmSource: source,
      },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

/**
 * Fetches pre-aggregated metrics from the optimized endpoint.
 * Returns ~100x fewer rows than fetchAnalyticsData for the same date range.
 */
export async function fetchAggregatedData(
  startDate: string,
  endDate: string,
  source: string,
  campaign?: string,
): Promise<AggregatedMetric[]> {
  try {
    const params: Record<string, string> = {
      startDate,
      endDate,
      utmSource: source,
    };
    if (campaign) params.utmCampaign = campaign;

    const response = await apiClient.get(`${API_BASE_URL}/utm/metrics-aggregated`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Aggregated API Error:", error);
    return [];
  }
}

/** Fetches distinct campaign names for a date range — lightweight query. */
export async function fetchAvailableCampaigns(
  startDate: string,
  endDate: string,
  source: string,
): Promise<string[]> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/campaigns`, {
      params: { startDate, endDate, utmSource: source },
    });
    return (response.data || []).map((r: any) => r.utm_campaign).filter(Boolean);
  } catch (error) {
    console.error("Campaigns API Error:", error);
    return [];
  }
}

export function processDataForDashboard(
  rawData: BackendMetric[],
  platform: "Facebook" | "Threads",
  selectedCampaign: string,
  mappingData: MappingEntry[],
): AggregatedPageData[] {
  const mappingLookup: Record<string, PageInfo> = {};
  for (let i = 0; i < mappingData.length; i++) {
    const entry = mappingData[i];
    for (let j = 0; j < entry.utmMediums.length; j++) {
      mappingLookup[entry.utmMediums[j]] = {
        pageName: entry.pageName,
        category: entry.category,
      };
    }
  }

  const grouped: Record<
    string,
    AggregatedPageData & { _dailyMap?: Record<string, any> }
  > = {};

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    if (selectedCampaign && row.utm_campaign !== selectedCampaign) continue;

    const rawMedium = row.utm_medium || "";
    const mappedInfo = mappingLookup[rawMedium];
    const pageName = mappedInfo ? mappedInfo.pageName : rawMedium;
    const category = mappedInfo ? mappedInfo.category : "Other";

    if (!grouped[pageName]) {
      grouped[pageName] = {
        pageName,
        category,
        totals: {
          sessions: 0,
          pageviews: 0,
          users: 0,
          new_users: 0,
          recurring_users: 0,
          identified_users: 0,
          event_count: 0,
          engagement_rate_avg: 0,
        },
        dailyTrend: [],
        _dailyMap: {},
      };
    }

    const pageEntry = grouped[pageName];
    const dailyMap = pageEntry._dailyMap!;

    const sessions = Number(row.sessions) || 0;
    const pageviews = Number(row.pageviews) || 0;
    const users = Number(row.users) || 0;
    const new_users = Number(row.new_users) || 0;
    const recurring_users = Number(row.recurring_users) || 0;
    const identified_users = Number(row.identified_users) || 0;
    const event_count = Number(row.event_count) || 0;
    const parsedEngagement = parseFloat(String(row.engagement_rate)) || 0;

    const totals = pageEntry.totals;
    totals.sessions += sessions;
    totals.pageviews += pageviews;
    totals.users += users;
    totals.new_users += new_users;
    totals.recurring_users += recurring_users;
    totals.identified_users += identified_users;
    totals.event_count += event_count;

    let existingDay = dailyMap[row.event_day];

    if (existingDay) {
      existingDay.sessions += sessions;
      existingDay.pageviews += pageviews;
      existingDay.users += users;
      existingDay.new_users += new_users;
      existingDay.recurring_users += recurring_users;
      existingDay.identified_users += identified_users;
      existingDay.event_count += event_count;

      existingDay.engagement_rate =
        (existingDay.engagement_rate + parsedEngagement) / 2;
    } else {
      existingDay = {
        date: row.event_day,
        sessions,
        pageviews,
        users,
        new_users,
        recurring_users,
        identified_users,
        event_count,
        engagement_rate: parsedEngagement,
      };

      dailyMap[row.event_day] = existingDay;

      pageEntry.dailyTrend.push(existingDay);
    }
  }

  const results = Object.values(grouped);
  for (let i = 0; i < results.length; i++) {
    const page = results[i];

    let totalEngRates = 0;
    for (let j = 0; j < page.dailyTrend.length; j++) {
      totalEngRates += page.dailyTrend[j].engagement_rate;
    }

    page.totals.engagement_rate_avg = page.dailyTrend.length
      ? totalEngRates / page.dailyTrend.length
      : 0;

    delete page._dailyMap;
  }

  return results;
}

/**
 * Lightweight processor for the pre-aggregated endpoint.
 * Data is already grouped by (date, medium) server-side,
 * so this just maps mediums to page names and builds the daily trend.
 */
export function processAggregatedData(
  rawData: AggregatedMetric[],
  selectedCampaign: string,
  mappingData: MappingEntry[],
): AggregatedPageData[] {
  // Campaign filtering is done server-side for aggregated data,
  // but we still filter here as a safety measure if needed.
  const filteredData = selectedCampaign ? rawData : rawData;

  const mappingLookup: Record<string, PageInfo> = {};
  for (let i = 0; i < mappingData.length; i++) {
    const entry = mappingData[i];
    for (let j = 0; j < entry.utmMediums.length; j++) {
      mappingLookup[entry.utmMediums[j]] = {
        pageName: entry.pageName,
        category: entry.category,
        team: entry.team,
      };
    }
  }

  const grouped: Record<
    string,
    AggregatedPageData & { _dailyMap?: Record<string, any> }
  > = {};

  for (let i = 0; i < filteredData.length; i++) {
    const row = filteredData[i];
    const rawMedium = row.utm_medium || "";
    const mappedInfo = mappingLookup[rawMedium];
    const pageName = mappedInfo ? mappedInfo.pageName : rawMedium;
    const category = mappedInfo ? mappedInfo.category : "Other";
    const team = mappedInfo?.team;

    if (!grouped[pageName]) {
      grouped[pageName] = {
        pageName,
        category,
        team,
        totals: {
          sessions: 0,
          pageviews: 0,
          users: 0,
          new_users: 0,
          recurring_users: 0,
          identified_users: 0,
          event_count: 0,
          engagement_rate_avg: 0,
        },
        dailyTrend: [],
        _dailyMap: {},
      };
    }

    const pageEntry = grouped[pageName];
    const dailyMap = pageEntry._dailyMap!;

    const sessions = Number(row.sessions) || 0;
    const pageviews = Number(row.pageviews) || 0;
    const users = Number(row.users) || 0;
    const new_users = Number(row.new_users) || 0;
    const recurring_users = Number(row.recurring_users) || 0;
    const identified_users = Number(row.identified_users) || 0;
    const event_count = Number(row.event_count) || 0;
    const parsedEngagement = parseFloat(String(row.engagement_rate)) || 0;

    const totals = pageEntry.totals;
    totals.sessions += sessions;
    totals.pageviews += pageviews;
    totals.users += users;
    totals.new_users += new_users;
    totals.recurring_users += recurring_users;
    totals.identified_users += identified_users;
    totals.event_count += event_count;

    let existingDay = dailyMap[row.event_day];
    if (existingDay) {
      existingDay.sessions += sessions;
      existingDay.pageviews += pageviews;
      existingDay.users += users;
      existingDay.new_users += new_users;
      existingDay.recurring_users += recurring_users;
      existingDay.identified_users += identified_users;
      existingDay.event_count += event_count;
      existingDay.engagement_rate = (existingDay.engagement_rate + parsedEngagement) / 2;
    } else {
      existingDay = {
        date: row.event_day,
        sessions,
        pageviews,
        users,
        new_users,
        recurring_users,
        identified_users,
        event_count,
        engagement_rate: parsedEngagement,
      };
      dailyMap[row.event_day] = existingDay;
      pageEntry.dailyTrend.push(existingDay);
    }
  }

  const results = Object.values(grouped);
  for (let i = 0; i < results.length; i++) {
    const page = results[i];
    let totalEngRates = 0;
    for (let j = 0; j < page.dailyTrend.length; j++) {
      totalEngRates += page.dailyTrend[j].engagement_rate;
    }
    page.totals.engagement_rate_avg = page.dailyTrend.length
      ? totalEngRates / page.dailyTrend.length
      : 0;
    delete page._dailyMap;
  }

  return results;
}

// ---- Revenue APIs ----

export interface RevenueMetricRow {
  date: string;
  pageName: string;
  team: string;
  bonus: string;
  photo: string;
  reel: string;
  story: string;
  text: string;
  total: string;
}

export interface RevenueMappingRow {
  id: number;
  pageId: string;
  pageName: string;
  team: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRevenueMetrics(
  startDate: string,
  endDate: string,
): Promise<RevenueMetricRow[]> {
  try {
    const response = await apiClient.get(`${REVENUE_URL}/metrics`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Revenue Metrics Error:", error);
    return [];
  }
}

export async function fetchRevenueMappings(): Promise<RevenueMappingRow[]> {
  try {
    const response = await apiClient.get(`${REVENUE_URL}/mappings`);
    return response.data;
  } catch (error) {
    console.error("Revenue Mappings Error:", error);
    return [];
  }
}

export async function updateRevenueMapping(
  id: number,
  team: string | null,
): Promise<RevenueMappingRow[]> {
  const response = await apiClient.patch(`${REVENUE_URL}/mappings/${id}`, { team });
  return response.data;
}
