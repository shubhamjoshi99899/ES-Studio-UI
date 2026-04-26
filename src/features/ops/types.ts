export type Platform = "Facebook" | "Instagram";

export type ScheduleStatus =
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

export type InboxStatus = "open" | "pending" | "resolved";

export type Priority = "low" | "medium" | "high" | "urgent";

export type CampaignStatus = "draft" | "active" | "completed";

export type Role = "Admin" | "Analyst" | "Content Manager";

export type ScheduleItem = {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  platforms: Platform[];
  status: ScheduleStatus;
  date: string;
  time: string;
  owner: string;
  approvalOwner: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  campaign: string;
};

export type InboxMessage = {
  id: string;
  customer: string;
  handle: string;
  platform: Platform;
  status: InboxStatus;
  priority: Priority;
  assignedTo: string;
  avatar: string;
  lastSeen: string;
  tags: string[];
  history: {
    label: string;
    value: string;
  }[];
  notes: string[];
  thread: Array<{
    id: string;
    author: string;
    kind: "customer" | "agent" | "note";
    message: string;
    time: string;
  }>;
};

export type InsightCard = {
  id: string;
  title: string;
  summary: string;
  severity: "positive" | "warning" | "critical" | "neutral";
  metric: string;
  delta: string;
  action: string;
};

export type AlertRule = {
  id: string;
  name: string;
  metric: string;
  operator: ">" | "<" | "drop";
  threshold: string;
  destination: {
    inApp: boolean;
    email: boolean;
  };
  enabled: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  platforms: Platform[];
  budget: number;
  spend: number;
  status: CampaignStatus;
  clicks: number;
  engagement: number;
  revenue: number;
  start: string;
  end: string;
  assets: Array<{
    id: string;
    title: string;
    type: "image" | "video";
  }>;
  linkedPosts: string[];
};

export type AutomationNodeKind = "trigger" | "condition" | "action";

export type AutomationNode = {
  id: string;
  kind: AutomationNodeKind;
  title: string;
  subtitle: string;
  x: number;
  y: number;
};

export type AutomationTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: AutomationNode[];
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  status: "active" | "invited";
  lastActive: string;
  initials: string;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
};
