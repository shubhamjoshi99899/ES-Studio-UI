export interface BackendMetric {
  event_day: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  recurring_users: number;
  identified_users: number;
  sessions: number;
  pageviews: number;
  users: number;
  new_users: number;
  event_count: number;
  engagement_rate: string | number;
}

/** Lean response from the aggregated endpoint — grouped by (date, medium) only */
export interface AggregatedMetric {
  event_day: string;
  utm_medium: string;
  sessions: number;
  pageviews: number;
  users: number;
  new_users: number;
  recurring_users: number;
  identified_users: number;
  event_count: number;
  engagement_rate: string | number;
}

export interface CountryStat {
  country: string;
  sessions: number;
}

export interface DailyMetric {
  date: string;
  sessions: number;
  pageviews: number;
  users: number;
  new_users: number;
  recurring_users: number;
  identified_users: number;
  event_count: number;
  engagement_rate: number;
}

export interface AggregatedPageData {
  pageName: string;
  category: string;
  team?: string;
  totals: {
    sessions: number;
    pageviews: number;
    users: number;
    new_users: number;
    recurring_users: number;
    identified_users: number;
    event_count: number;
    engagement_rate_avg: number;
  };
  dailyTrend: DailyMetric[];
}

export interface HeadlineData {
  daily: {
    date: string;
    sessions: number;
    prevSessions: number;
    diff: number;
  };
  weekly: {
    range: string;
    sessions: number;
    prevSessions: number;
    diff: number;
  };
}
