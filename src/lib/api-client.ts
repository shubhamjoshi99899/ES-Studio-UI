export type TeamSize = "1-5" | "6-20" | "21-100" | "101-500" | "500+";
export type Industry = "media" | "agency" | "ecommerce" | "creator" | "enterprise" | "other";
export type Platform = "facebook" | "instagram" | "linkedin" | "tiktok";
export type TeamRole = "admin" | "analyst" | "content_manager";
export type MemberStatus = "invited" | "active" | "suspended";
export type PostStatus = "draft" | "review" | "approved" | "scheduled" | "published" | "failed";
export type PostPlatform = "facebook" | "instagram" | "linkedin" | "tiktok";
export type InboxPlatform = "facebook" | "instagram" | "linkedin" | "tiktok";
export type InboxThreadStatus = "open" | "pending" | "resolved";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || API_BASE_URL || "").trim();

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailResponse {
  success?: boolean;
  message?: string;
}

export interface CreateWorkspaceInput {
  orgName: string;
  slug: string;
  teamSize: TeamSize;
  industry: Industry;
  platforms: Platform[];
}

export interface CreateWorkspaceResponse {
  workspaceId?: string;
  slug?: string;
  message?: string;
  [key: string]: unknown;
}

export interface SwitchWorkspaceInput {
  workspaceId: string;
}

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  workspaceId?: string | null;
  currentWorkspaceId?: string | null;
  workspace?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
  } | null;
  [key: string]: unknown;
}

export interface TeamMember {
  id: string;
  userId: string;
  email?: string | null;
  name: string | null;
  role: TeamRole;
  status: MemberStatus;
  invitedAt: string;
  acceptedAt: string | null;
}

export interface TeamRoleOption {
  value?: string;
  role?: string;
  key?: string;
  label?: string;
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface InviteMemberInput {
  email: string;
  role: TeamRole;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  meta: { page: number; limit: number; total: number };
}

export interface AcceptInviteResponse {
  success?: boolean;
  message?: string;
  workspaceId?: string;
  slug?: string;
}

export interface TeamMutationResponse {
  success?: boolean;
  message?: string;
}

export interface Post {
  id: string;
  workspaceId: string;
  title: string;
  caption: string;
  hashtags: string[];
  platforms: PostPlatform[];
  mediaType: string;
  status: PostStatus;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  title: string;
  caption: string;
  hashtags?: string[];
  platforms: PostPlatform[];
  mediaType: string;
  scheduledAt?: string;
  campaignId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: "draft" | "active" | "completed";
  platforms: PostPlatform[];
  budget: number | null;
  spend: number;
  startDate: string;
  endDate: string | null;
  totalPosts: number;
  publishedPosts: number;
  totalReach: number;
  totalRevenue: number;
}

export interface CreateCampaignInput {
  name: string;
  objective: string;
  platforms: PostPlatform[];
  budget?: number;
  startDate: string;
  endDate?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metricFamily: "traffic" | "revenue" | "engagement";
  operator: "gt" | "lt" | "pct_drop" | "pct_rise";
  threshold: number;
  timeWindow: "1d" | "7d" | "30d";
  channels: string[];
  enabled: boolean;
}

export interface CreateAlertRuleInput {
  name: string;
  metricFamily: string;
  operator: string;
  threshold: number;
  timeWindow: string;
  channels: string[];
  enabled: boolean;
}

export interface InsightCard {
  id: string;
  type: string;
  severity: "positive" | "warning" | "critical" | "neutral";
  title: string;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface Subscription {
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "past_due" | "cancelled" | "trialing";
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

export interface InboxContact {
  id?: string;
  name?: string | null;
  externalId?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

export interface InboxThread {
  id: string;
  platform: InboxPlatform;
  status: InboxThreadStatus;
  contact?: InboxContact | null;
  contactId?: string | null;
  assignedTo?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  messages?: InboxMessage[];
  [key: string]: unknown;
}

export interface InboxMessage {
  id: string;
  threadId?: string;
  direction: "inbound" | "outbound";
  senderName?: string | null;
  body: string;
  createdAt: string;
  readAt: string | null;
  [key: string]: unknown;
}

export interface UpdateInboxThreadInput {
  status?: string;
  assignedTo?: string;
}

export interface ApiErrorShape {
  message?: string;
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorShape | null;

  constructor(status: number, message: string, data: ApiErrorShape | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function buildBackendUrl(path: string) {
  if (!BACKEND_BASE_URL) {
    return path;
  }

  return `${BACKEND_BASE_URL}${path}`;
}

export function getCurrentWorkspaceId(user: AuthUser | null) {
  if (!user) {
    return null;
  }

  return user.currentWorkspaceId ?? user.workspaceId ?? user.workspace?.id ?? null;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await response.json()) as ApiErrorShape | T) : null;

  if (!response.ok) {
    const data = (payload as ApiErrorShape | null) ?? null;
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, data);
  }

  if (response.status === 204) {
    return null as T;
  }

  return payload as T;
}

export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<VerifyEmailResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: LoginInput) =>
    apiFetch<AuthUser | Record<string, unknown>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  logout: () =>
    apiFetch<{ success?: boolean; message?: string }>("/api/auth/logout", {
      method: "POST",
    }),

  refresh: () =>
    apiFetch<{ success?: boolean; message?: string }>("/api/auth/refresh", {
      method: "POST",
    }),

  me: () => apiFetch<AuthUser>("/api/auth/me"),

  verifyEmail: (token: string) =>
    apiFetch<VerifyEmailResponse>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),

  createWorkspace: (input: CreateWorkspaceInput) =>
    apiFetch<CreateWorkspaceResponse>("/api/auth/workspace/create", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  switchWorkspace: (input: SwitchWorkspaceInput) =>
    apiFetch<CreateWorkspaceResponse>("/api/auth/switch-workspace", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  googleLogin: () => {
    window.location.href = buildBackendUrl("/api/auth/google");
  },
};

export const api = {
  ...authApi,

  acceptInvite: (token: string) =>
    apiFetch<AcceptInviteResponse>("/api/ops/team/invites/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  getMembers: () =>
    apiFetch<TeamMember[]>("/api/ops/team/members"),

  inviteMember: (data: InviteMemberInput) =>
    apiFetch("/api/ops/team/invites", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateMemberRole: (memberId: string, role: TeamRole) =>
    apiFetch(`/api/ops/team/members/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  updateMemberStatus: (memberId: string, status: MemberStatus) =>
    apiFetch<TeamMutationResponse>(`/api/ops/team/members/${memberId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getRoles: () =>
    apiFetch<TeamRoleOption[]>("/api/ops/team/roles"),

  getAuditLog: (page = 1, limit = 20) =>
    apiFetch<AuditLogResponse>(
      `/api/ops/team/audit-log?page=${page}&limit=${limit}`,
    ),

  getPosts: (params?: { status?: string; platform?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<Post[]>("/api/ops/schedule/posts" + (q ? `?${q}` : ""));
  },

  createPost: (data: CreatePostInput) =>
    apiFetch<Post>("/api/ops/schedule/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePost: (id: string, data: Partial<CreatePostInput>) =>
    apiFetch<Post>(`/api/ops/schedule/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePost: (id: string) =>
    apiFetch(`/api/ops/schedule/posts/${id}`, { method: "DELETE" }),

  submitForReview: (id: string) =>
    apiFetch(`/api/ops/schedule/posts/${id}/submit-for-review`, {
      method: "POST",
    }),

  approvePost: (id: string) =>
    apiFetch(`/api/ops/schedule/posts/${id}/approve`, { method: "POST" }),

  rejectPost: (id: string) =>
    apiFetch(`/api/ops/schedule/posts/${id}/reject`, { method: "POST" }),

  schedulePost: (id: string, scheduled_at: string) =>
    apiFetch(`/api/ops/schedule/posts/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduled_at }),
    }),

  getCampaigns: () =>
    apiFetch<Campaign[]>("/api/ops/campaigns"),

  getCampaign: (id: string) =>
    apiFetch<Campaign>(`/api/ops/campaigns/${id}`),

  createCampaign: (data: CreateCampaignInput) =>
    apiFetch<Campaign>("/api/ops/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCampaign: (id: string, data: Partial<CreateCampaignInput>) =>
    apiFetch<Campaign>(`/api/ops/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCampaign: (id: string) =>
    apiFetch(`/api/ops/campaigns/${id}`, { method: "DELETE" }),

  linkPost: (campaignId: string, postId: string) =>
    apiFetch(`/api/ops/campaigns/${campaignId}/posts/${postId}`, {
      method: "POST",
    }),

  unlinkPost: (campaignId: string, postId: string) =>
    apiFetch(`/api/ops/campaigns/${campaignId}/posts/${postId}`, {
      method: "DELETE",
    }),

  getAlertRules: () =>
    apiFetch<AlertRule[]>("/api/ops/alerts/rules"),

  createAlertRule: (data: CreateAlertRuleInput) =>
    apiFetch<AlertRule>("/api/ops/alerts/rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAlertRule: (id: string, data: Partial<CreateAlertRuleInput>) =>
    apiFetch<AlertRule>(`/api/ops/alerts/rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAlertRule: (id: string) =>
    apiFetch(`/api/ops/alerts/rules/${id}`, { method: "DELETE" }),

  getInsights: () =>
    apiFetch<InsightCard[]>("/api/ops/alerts/insights"),

  getNotifications: () =>
    apiFetch<Notification[]>("/api/ops/notifications"),

  markRead: (id: string) =>
    apiFetch(`/api/ops/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    apiFetch("/api/ops/notifications/read-all", { method: "POST" }),

  getSubscription: () =>
    apiFetch<Subscription>("/api/billing/subscription"),

  getThreads: (params?: { status?: string; platform?: string; page?: number }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value != null && value !== "") {
          acc[key] = String(value);
        }

        return acc;
      }, {}),
    ).toString();

    return apiFetch<InboxThread[]>("/api/ops/inbox/threads" + (q ? `?${q}` : ""));
  },

  getThread: (id: string) =>
    apiFetch<InboxThread>(`/api/ops/inbox/threads/${id}`),

  getMessages: (threadId: string) =>
    apiFetch<InboxMessage[]>(`/api/ops/inbox/threads/${threadId}/messages`),

  updateThread: (id: string, data: UpdateInboxThreadInput) =>
    apiFetch<InboxThread>(`/api/ops/inbox/threads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  sendReply: (threadId: string, body: string) =>
    apiFetch(`/api/ops/inbox/threads/${threadId}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  createCheckout: (priceId: string) =>
    apiFetch<{ url: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/settings/billing?success=true`,
        cancelUrl: `${window.location.origin}/settings/billing?cancelled=true`,
      }),
    }).then((response) => {
      window.location.href = response.url;
    }),

  cancelSubscription: () =>
    apiFetch("/api/billing/cancel", { method: "POST" }),
};
