import axios from "axios";
import { MappingEntry } from "../data/page-mapping";
import { AggregatedPageData, BackendMetric, HeadlineData } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE_URL = `${BASE_URL}/v1/analytics`;
const MAPPINGS_URL = `${BASE_URL}/page-mappings`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "x-api-key": process.env.NEXT_PUBLIC_ANALYTICS_API_KEY || "",
  },
});

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

export async function createPageMapping(mapping: MappingEntry) {
  return apiClient.post(MAPPINGS_URL, mapping);
}

export async function deletePageMapping(id: number) {
  return apiClient.delete(`${MAPPINGS_URL}/${id}`);
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

export function processDataForDashboard(
  rawData: BackendMetric[],
  platform: "Facebook" | "Threads",
  selectedCampaign: string,
  mappingData: MappingEntry[],
): AggregatedPageData[] {
  const mappingLookup: Record<string, PageInfo> = {};
  mappingData.forEach((entry) => {
    entry.utmMediums.forEach((medium) => {
      mappingLookup[medium] = {
        pageName: entry.pageName,
        category: entry.category,
      };
    });
  });

  const grouped: Record<string, AggregatedPageData> = {};

  rawData.forEach((row) => {
    if (selectedCampaign && row.utm_campaign !== selectedCampaign) return;
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
      };
    }

    const pageEntry = grouped[pageName];
    const parsedEngagement = parseFloat(String(row.engagement_rate)) || 0;

    pageEntry.totals.sessions += Number(row.sessions);
    pageEntry.totals.pageviews += Number(row.pageviews);
    pageEntry.totals.users += Number(row.users);
    pageEntry.totals.new_users += Number(row.new_users);
    pageEntry.totals.recurring_users += Number(row.recurring_users || 0);
    pageEntry.totals.identified_users += Number(row.identified_users || 0);
    pageEntry.totals.event_count += Number(row.event_count);

    const existingDay = pageEntry.dailyTrend.find(
      (d) => d.date === row.event_day,
    );

    if (existingDay) {
      existingDay.sessions += Number(row.sessions);
      existingDay.pageviews += Number(row.pageviews);
      existingDay.users += Number(row.users);
      existingDay.new_users += Number(row.new_users);
      existingDay.recurring_users += Number(row.recurring_users || 0);
      existingDay.identified_users += Number(row.identified_users || 0);
      existingDay.event_count += Number(row.event_count);

      existingDay.engagement_rate =
        (existingDay.engagement_rate + parsedEngagement) / 2;
    } else {
      pageEntry.dailyTrend.push({
        date: row.event_day,
        sessions: Number(row.sessions),
        pageviews: Number(row.pageviews),
        users: Number(row.users),
        new_users: Number(row.new_users),
        recurring_users: Number(row.recurring_users || 0),
        identified_users: Number(row.identified_users || 0),
        event_count: Number(row.event_count),
        engagement_rate: parsedEngagement,
      });
    }
  });

  Object.values(grouped).forEach((page) => {
    const totalEngRates = page.dailyTrend.reduce(
      (acc, curr) => acc + curr.engagement_rate,
      0,
    );
    page.totals.engagement_rate_avg = page.dailyTrend.length
      ? totalEngRates / page.dailyTrend.length
      : 0;
  });

  return Object.values(grouped);
}
