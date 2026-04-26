"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Lock, Send } from "lucide-react";
import { useMessages, useSendReply, useThread, useThreads, useUpdateThread } from "@/hooks/use-inbox";
import { useMembers } from "@/hooks/use-team";
import {
  ApiError,
  type InboxMessage,
  type InboxPlatform,
  type InboxThread,
  type InboxThreadStatus,
  type PostPlatform,
} from "@/lib/api-client";

const PLATFORM_TABS: Array<{ label: string; value: "all" | InboxPlatform }> = [
  { label: "All", value: "all" },
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "TikTok", value: "tiktok" },
];

const STATUS_TABS: Array<{ label: string; value: InboxThreadStatus }> = [
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Resolved", value: "resolved" },
];

const PLATFORM_BADGE_STYLES: Record<PostPlatform, string> = {
  facebook: "bg-blue-50 text-blue-700",
  instagram: "bg-pink-50 text-pink-700",
  linkedin: "bg-sky-50 text-sky-700",
  tiktok: "bg-slate-100 text-slate-700",
};

const STATUS_BADGE_STYLES: Record<InboxThreadStatus, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  resolved: "border-gray-200 bg-gray-100 text-gray-700",
};

type NormalizedThread = {
  id: string;
  platform: InboxPlatform;
  status: InboxThreadStatus;
  contactName: string;
  externalId: string;
  assignedTo: string;
  preview: string;
  lastMessageAt: string | null;
  unread: boolean;
};

type NormalizedMessage = {
  id: string;
  direction: "inbound" | "outbound";
  senderName: string;
  body: string;
  createdAt: string | null;
  readAt: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNullableString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function normalizePlatform(value: unknown): InboxPlatform {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized === "facebook" || normalized === "instagram" || normalized === "linkedin" || normalized === "tiktok") {
    return normalized;
  }

  return "facebook";
}

function normalizeStatus(value: unknown): InboxThreadStatus {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized === "open" || normalized === "pending" || normalized === "resolved") {
    return normalized;
  }

  return "open";
}

function formatTimeAgo(value: string | null) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMessageTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function normalizeThread(thread: InboxThread): NormalizedThread {
  const record = thread as unknown as Record<string, unknown>;
  const contact = isRecord(record.contact) ? record.contact : null;
  const messages = Array.isArray(record.messages) ? record.messages : [];
  const lastMessage = messages[messages.length - 1];

  const contactName =
    getNullableString(contact ?? {}, "name", "fullName", "displayName") ??
    getNullableString(record, "contactName", "contact_name", "customerName", "customer_name") ??
    getNullableString(contact ?? {}, "externalId", "external_id") ??
    getNullableString(record, "externalId", "external_id", "contactId", "contact_id") ??
    "Unknown contact";

  const externalId =
    getNullableString(contact ?? {}, "externalId", "external_id") ??
    getNullableString(record, "externalId", "external_id", "contactId", "contact_id") ??
    contactName;

  const preview =
    getNullableString(record, "lastMessagePreview", "last_message_preview", "snippet") ??
    (isRecord(lastMessage)
      ? getNullableString(lastMessage, "body", "message", "text")
      : null) ??
    "No messages yet";

  const lastMessageAt =
    getNullableString(record, "lastMessageAt", "last_message_at", "updatedAt", "updated_at", "createdAt", "created_at") ??
    (isRecord(lastMessage)
      ? getNullableString(lastMessage, "createdAt", "created_at", "sentAt", "sent_at")
      : null);

  const unreadCount = getNumber(record, "unreadCount", "unread_count");
  const unread =
    (typeof unreadCount === "number" && unreadCount > 0) ||
    messages.some((message) => {
      if (!isRecord(message)) {
        return false;
      }

      const readAt = getNullableString(message, "readAt", "read_at");
      return readAt == null;
    });

  return {
    id: thread.id,
    platform: normalizePlatform(record.platform),
    status: normalizeStatus(record.status),
    contactName,
    externalId,
    assignedTo:
      getNullableString(record, "assignedTo", "assigned_to", "assigneeName", "assignee_name") ??
      "",
    preview,
    lastMessageAt,
    unread,
  };
}

function normalizeMessage(message: InboxMessage): NormalizedMessage {
  const record = message as unknown as Record<string, unknown>;
  const directionValue = String(record.direction ?? record.kind ?? "").toLowerCase();
  const direction =
    directionValue === "outbound" || directionValue === "agent"
      ? "outbound"
      : "inbound";

  return {
    id: message.id,
    direction,
    senderName:
      getNullableString(record, "senderName", "sender_name", "author", "fromName", "from_name") ??
      (direction === "outbound" ? "You" : "Contact"),
    body: getNullableString(record, "body", "message", "text") ?? "",
    createdAt:
      getNullableString(record, "createdAt", "created_at", "sentAt", "sent_at") ??
      null,
    readAt: getNullableString(record, "readAt", "read_at"),
  };
}

function PlatformBadge({ platform }: { platform: InboxPlatform }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${PLATFORM_BADGE_STYLES[platform]}`}
    >
      {platform}
    </span>
  );
}

function StatusBadge({ status }: { status: InboxThreadStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function ThreadSkeletonRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <div
      key={`thread-skeleton-${index}`}
      className="rounded-xl border border-gray-100 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-52 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  ));
}

function MessageSkeletonRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <div
      key={`message-skeleton-${index}`}
      className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
    >
      <div className="max-w-[75%] rounded-2xl bg-gray-100 px-4 py-3">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-4 w-56 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  ));
}

export default function SmartBoxPage() {
  const [platformFilter, setPlatformFilter] = useState<"all" | InboxPlatform>("all");
  const [statusFilter, setStatusFilter] = useState<InboxThreadStatus>("open");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [actionError, setActionError] = useState("");

  const threadParams = useMemo(
    () => ({
      status: statusFilter,
      ...(platformFilter !== "all" ? { platform: platformFilter } : {}),
      page: 1,
    }),
    [platformFilter, statusFilter],
  );

  const { threads, error: threadsError, isLoading: isThreadsLoading } = useThreads(threadParams);
  const { members } = useMembers();
  const normalizedThreads = useMemo(() => threads.map(normalizeThread), [threads]);
  const activeThreadId = selectedThreadId || normalizedThreads[0]?.id || "__pending__";
  const hasActiveThread = normalizedThreads.some((thread) => thread.id === activeThreadId);

  const {
    thread,
    error: threadError,
    isLoading: isThreadLoading,
    mutate: mutateThread,
  } = useThread(activeThreadId);
  const {
    messages,
    error: messagesError,
    isLoading: isMessagesLoading,
    mutate: mutateMessages,
  } = useMessages(activeThreadId);
  const { sendReply, isSending } = useSendReply();
  const { updateThread, isUpdating } = useUpdateThread();

  const normalizedActiveThread = hasActiveThread && thread ? normalizeThread(thread) : null;
  const normalizedMessages = useMemo(
    () => (hasActiveThread ? messages.map(normalizeMessage) : []),
    [hasActiveThread, messages],
  );
  const replyDisabled = normalizedActiveThread?.platform === "tiktok";
  const replyDisabledReason = "TikTok does not support replies via API.";

  useEffect(() => {
    if (!normalizedThreads.length) {
      setSelectedThreadId("");
      return;
    }

    if (!selectedThreadId || !normalizedThreads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(normalizedThreads[0].id);
    }
  }, [normalizedThreads, selectedThreadId]);

  async function handleAssignChange(assignedTo: string) {
    if (!normalizedActiveThread) {
      return;
    }

    setActionError("");

    try {
      await updateThread(normalizedActiveThread.id, { assignedTo });
      await mutateThread();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  async function handleStatusChange(status: InboxThreadStatus) {
    if (!normalizedActiveThread) {
      return;
    }

    setActionError("");

    try {
      await updateThread(normalizedActiveThread.id, { status });
      await mutateThread();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedActiveThread || !replyBody.trim() || replyDisabled) {
      return;
    }

    setActionError("");

    try {
      await sendReply(normalizedActiveThread.id, replyBody.trim());
      await mutateMessages();
      setReplyBody("");
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">Smart Inbox</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review incoming conversations, assign ownership, and respond from one workspace inbox.
        </p>
      </div>

      {threadsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load inbox threads — try refreshing the page.
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-1">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Conversations</h2>
              <p className="mt-1 text-sm text-gray-600">
                Filter by platform and thread status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PLATFORM_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setPlatformFilter(tab.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    platformFilter === tab.value
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    statusFilter === tab.value
                      ? "bg-slate-900 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isThreadsLoading ? <ThreadSkeletonRows /> : null}

            {!isThreadsLoading && normalizedThreads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500">
                No messages yet — connect a platform to start receiving messages
              </div>
            ) : null}

            {!isThreadsLoading
              ? normalizedThreads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      thread.id === activeThreadId
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-medium text-gray-950">
                            {thread.contactName || thread.externalId}
                          </div>
                          {thread.unread ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <PlatformBadge platform={thread.platform} />
                        </div>
                        <div className="mt-3 text-sm text-gray-500">
                          {truncate(thread.preview || "No messages yet", 60)}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-gray-400">
                        {formatTimeAgo(thread.lastMessageAt)}
                      </div>
                    </div>
                  </button>
                ))
              : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-2">
          {!hasActiveThread ? (
            <div className="flex min-h-[480px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              Select a conversation
            </div>
          ) : (
            <div className="flex min-h-[480px] flex-col">
              {threadError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load thread details.
                </div>
              ) : null}

              <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xl font-semibold text-gray-950">
                    {normalizedActiveThread?.contactName || normalizedActiveThread?.externalId}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {normalizedActiveThread ? <PlatformBadge platform={normalizedActiveThread.platform} /> : null}
                    {normalizedActiveThread ? <StatusBadge status={normalizedActiveThread.status} /> : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:min-w-[280px]">
                  <label className="text-sm font-medium text-gray-700">
                    Assign to
                    <select
                      value={normalizedActiveThread?.assignedTo ?? ""}
                      onChange={(event) => {
                        void handleAssignChange(event.target.value);
                      }}
                      disabled={isUpdating || isThreadLoading}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.name ?? member.email ?? member.id}>
                          {member.name ?? member.email ?? member.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_TABS.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        disabled={isUpdating || isThreadLoading}
                        onClick={() => {
                          void handleStatusChange(tab.value);
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          normalizedActiveThread?.status === tab.value
                            ? "bg-slate-900 text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex-1 space-y-4 overflow-y-auto rounded-xl bg-gray-50 p-4">
                {isMessagesLoading || isThreadLoading ? <MessageSkeletonRows /> : null}

                {messagesError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to load thread messages.
                  </div>
                ) : null}

                {!isMessagesLoading && normalizedMessages.length === 0 ? (
                  <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-500">
                    No messages in this conversation yet.
                  </div>
                ) : null}

                {!isMessagesLoading
                  ? normalizedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                            message.direction === "outbound"
                              ? "bg-slate-900 text-white"
                              : "bg-white text-gray-800"
                          }`}
                        >
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                            {message.senderName}
                          </div>
                          <div className="text-sm leading-6">{message.body}</div>
                          <div className="mt-2 text-xs opacity-70">
                            {formatMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
              </div>

              <form onSubmit={handleReplySubmit} className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
                <textarea
                  rows={4}
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  placeholder="Write your reply"
                  disabled={replyDisabled}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-gray-500">
                    {replyDisabled ? replyDisabledReason : "Replies are sent to the connected platform thread."}
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || replyDisabled || !replyBody.trim()}
                    title={replyDisabled ? replyDisabledReason : undefined}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {replyDisabled ? <Lock size={16} /> : <Send size={16} />}
                    {isSending ? "Sending..." : "Send reply"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
