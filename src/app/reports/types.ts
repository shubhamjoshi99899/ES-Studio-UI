export interface Profile {
  profileId: string;
  name: string;
  platform: "facebook" | "instagram";
  syncState?: string;
  lastSyncError?: string;
}

export interface AggregatedData {
  timeSeries: Array<{
    date: string;
    followersGained: number;
    unfollows: number;
    netFollowers: number;
    totalAudience: number;
    impressions: number;
    engagements: number;
    engagementRate: number;
    pageViews: number;
    videoViews: number;
    messages: number;
  }>;
  totals: {
    currentAudience: number;
    audienceChange: string;
    netGrowth: number;
    growthChange: string;
    impressions: number;
    impressionsChange: string;
    engagements: number;
    engagementsChange: string;
    engagementRate: string;
    engagementRateChange: string;
    pageViews: number;
    pageViewsChange: string;
    videoViews: number;
    videoViewsChange: string;
    messages: number;
    messagesChange: string;
  };
}

export type MetricKey =
  | "netFollowers"
  | "impressions"
  | "engagements"
  | "engagementRate"
  | "pageViews"
  | "videoViews"
  | "messages";

export const METRIC_CONFIG: Record<MetricKey, any> = {
  netFollowers: {
    label: "Net Followers",
    title: "Audience Growth",
    desc: "See how your audience grew during the selected time period.",
    color: "#7c3aed",
    type: "line",
    valueKey: "netGrowth",
    changeKey: "growthChange",
    suffix: "",
  },

  impressions: {
    label: "Impressions",
    title: "Impressions",
    desc: "Total unique reach combined with video and media views.",
    color: "#0ea5e9",
    type: "area",
    valueKey: "impressions",
    changeKey: "impressionsChange",
    suffix: "",
  },

  engagements: {
    label: "Engagements",
    title: "Engagements",
    desc: "Review engagement across your selected profiles.",
    color: "#ec4899",
    type: "area",
    valueKey: "engagements",
    changeKey: "engagementsChange",
    suffix: "",
  },
  engagementRate: {
    label: "Eng. Rate",
    title: "Engagement Rate",
    desc: "Review your engagement rate per impression.",
    color: "#f59e0b",
    type: "area",
    valueKey: "engagementRate",
    changeKey: "engagementRateChange",
    suffix: "%",
  },
  pageViews: {
    label: "Page Views",
    title: "Page Views",
    desc: "Review your total profile page views.",
    color: "#3b82f6",
    type: "area",
    valueKey: "pageViews",
    changeKey: "pageViewsChange",
    suffix: "",
  },
  videoViews: {
    label: "Video Views",
    title: "Video Views",
    desc: "Review your total post video views.",
    color: "#8b5cf6",
    type: "area",
    valueKey: "videoViews",
    changeKey: "videoViewsChange",
    suffix: "",
  },
  messages: {
    label: "Net Messages",
    title: "Net Messages",
    desc: "Review your inbound conversation volume.",
    color: "#10b981",
    type: "area",
    valueKey: "messages",
    changeKey: "messagesChange",
    suffix: "",
  },
};
