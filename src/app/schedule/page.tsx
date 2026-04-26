"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import useSWRMutation from "swr/mutation";
import { CalendarClock, Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { usePosts, useCreatePost } from "@/hooks/use-schedule";
import { useMembers } from "@/hooks/use-team";
import {
  ApiError,
  api,
  type CreatePostInput,
  type Post,
  type PostPlatform,
  type TeamRole,
} from "@/lib/api-client";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Approved", value: "approved" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
] as const;

const PLATFORM_OPTIONS: PostPlatform[] = ["facebook", "instagram", "linkedin", "tiktok"];

const STATUS_BADGE_STYLES: Record<string, string> = {
  draft: "border-gray-200 bg-gray-100 text-gray-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  published: "border-indigo-200 bg-indigo-50 text-indigo-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const PLATFORM_BADGE_STYLES: Record<PostPlatform, string> = {
  facebook: "bg-blue-50 text-blue-700",
  instagram: "bg-pink-50 text-pink-700",
  linkedin: "bg-sky-50 text-sky-700",
  tiktok: "bg-slate-100 text-slate-700",
};

const EMPTY_CREATE_FORM: CreatePostFormState = {
  title: "",
  caption: "",
  hashtags: "",
  platforms: ["instagram"],
  mediaType: "image",
  scheduledAt: "",
};

type CreatePostFormState = {
  title: string;
  caption: string;
  hashtags: string;
  platforms: PostPlatform[];
  mediaType: string;
  scheduledAt: string;
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function StatusBadge({ status }: { status: Post["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.draft,
      )}
    >
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: PostPlatform }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        PLATFORM_BADGE_STYLES[platform],
      )}
    >
      {platform}
    </span>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={`schedule-skeleton-${index}`} className="border-t border-gray-100">
      <td className="px-4 py-4">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-4">
        <div className="ml-auto h-10 w-36 animate-pulse rounded-xl bg-gray-200" />
      </td>
    </tr>
  ));
}

function CreatePostModal({
  isOpen,
  isSubmitting,
  error,
  form,
  onClose,
  onChange,
  onTogglePlatform,
  onSubmit,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string;
  form: CreatePostFormState;
  onClose: () => void;
  onChange: (field: keyof CreatePostFormState, value: string) => void;
  onTogglePlatform: (platform: PostPlatform) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">New post</h2>
            <p className="mt-1 text-sm text-gray-600">
              Create a post draft and optionally pre-fill its scheduled time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close create post modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="post-title" className="mb-2 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="post-title"
              value={form.title}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder="Q2 launch teaser"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label htmlFor="post-caption" className="mb-2 block text-sm font-medium text-gray-700">
              Caption
            </label>
            <textarea
              id="post-caption"
              rows={5}
              value={form.caption}
              onChange={(event) => onChange("caption", event.target.value)}
              placeholder="Write the post copy, CTA, and supporting context."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="post-hashtags" className="mb-2 block text-sm font-medium text-gray-700">
                Hashtags
              </label>
              <input
                id="post-hashtags"
                value={form.hashtags}
                onChange={(event) => onChange("hashtags", event.target.value)}
                placeholder="#socialmetrics, #growth"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label htmlFor="post-media-type" className="mb-2 block text-sm font-medium text-gray-700">
                Media type
              </label>
              <select
                id="post-media-type"
                value={form.mediaType}
                onChange={(event) => onChange("mediaType", event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="carousel">Carousel</option>
                <option value="story">Story</option>
              </select>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">Platforms</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((platform) => {
                const selected = form.platforms.includes(platform);

                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => onTogglePlatform(platform)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium capitalize transition",
                      selected
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400",
                    )}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="post-scheduled-at" className="mb-2 block text-sm font-medium text-gray-700">
              Scheduled date
            </label>
            <input
              id="post-scheduled-at"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => onChange("scheduledAt", event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_TABS)[number]["value"]>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [createForm, setCreateForm] = useState<CreatePostFormState>(EMPTY_CREATE_FORM);
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");

  const params = useMemo(
    () => (statusFilter === "all" ? undefined : { status: statusFilter }),
    [statusFilter],
  );
  const { posts, error, isLoading, mutate } = usePosts(params);
  const { createPost, isCreating } = useCreatePost();
  const { members } = useMembers();

  const currentUserId =
    user?.id ??
    (typeof user?.userId === "string" ? user.userId : null);
  const currentMember = members.find((member) => member.userId === currentUserId);
  const currentUserRole: TeamRole = currentMember?.role ?? "analyst";
  const canApproveReview = currentUserRole === "admin" || currentUserRole === "content_manager";

  const { trigger: submitForReview, isMutating: isSubmittingForReview } = useSWRMutation(
    "schedule/posts/submit-for-review",
    (_, { arg }: { arg: { id: string } }) => api.submitForReview(arg.id),
  );
  const { trigger: approvePost, isMutating: isApproving } = useSWRMutation(
    "schedule/posts/approve",
    (_, { arg }: { arg: { id: string } }) => api.approvePost(arg.id),
  );
  const { trigger: rejectPost, isMutating: isRejecting } = useSWRMutation(
    "schedule/posts/reject",
    (_, { arg }: { arg: { id: string } }) => api.rejectPost(arg.id),
  );
  const { trigger: schedulePost, isMutating: isScheduling } = useSWRMutation(
    "schedule/posts/schedule",
    (_, { arg }: { arg: { id: string; scheduledAt: string } }) =>
      api.schedulePost(arg.id, arg.scheduledAt),
  );

  const isWorking = isSubmittingForReview || isApproving || isRejecting || isScheduling;

  function resetCreateForm() {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError("");
  }

  function handleCreateFormChange(field: keyof CreatePostFormState, value: string) {
    setCreateForm((current) => ({ ...current, [field]: value }));
  }

  function togglePlatform(platform: PostPlatform) {
    setCreateForm((current) => {
      const nextPlatforms = current.platforms.includes(platform)
        ? current.platforms.filter((value) => value !== platform)
        : [...current.platforms, platform];

      return {
        ...current,
        platforms: nextPlatforms.length > 0 ? nextPlatforms : [platform],
      };
    });
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");

    if (!createForm.title.trim()) {
      setCreateError("Title is required");
      return;
    }

    if (!createForm.caption.trim()) {
      setCreateError("Caption is required");
      return;
    }

    if (createForm.platforms.length === 0) {
      setCreateError("Select at least one platform");
      return;
    }

    try {
      const input: CreatePostInput = {
        title: createForm.title.trim(),
        caption: createForm.caption.trim(),
        hashtags: createForm.hashtags
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        platforms: createForm.platforms,
        mediaType: createForm.mediaType,
        ...(createForm.scheduledAt ? { scheduledAt: toIsoString(createForm.scheduledAt) } : {}),
      };

      await createPost(input);
      await mutate();
      resetCreateForm();
      setIsCreateModalOpen(false);
    } catch (mutationError) {
      setCreateError(getErrorMessage(mutationError));
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    setActionError("");

    try {
      await action();
      await mutate();
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError));
    }
  }

  function startScheduling(post: Post) {
    setSchedulingPostId(post.id);
    setScheduleValue(toDatetimeLocalValue(post.scheduledAt));
    setActionError("");
  }

  return (
    <>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-950">Schedule</h1>
            <p className="mt-1 text-sm text-gray-600">
              Plan, review, and publish social content across your workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={16} />
            New post
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const selected = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  selected
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load scheduled posts — try refreshing the page.
          </div>
        ) : null}

        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Post
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Platforms
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Scheduled
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? <LoadingRows /> : null}

                {!isLoading && posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
                        <CalendarClock className="h-8 w-8 text-gray-300" />
                        <span>No posts yet — create your first post</span>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? posts.map((post) => {
                      const isRowScheduling = schedulingPostId === post.id;
                      const retryValue = post.scheduledAt ?? new Date().toISOString();

                      return (
                        <tr key={post.id}>
                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-950">{post.title}</div>
                              <div className="max-w-xl text-sm text-gray-500">{post.caption}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              {post.platforms.map((platform) => (
                                <PlatformBadge key={`${post.id}-${platform}`} platform={platform} />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <StatusBadge status={post.status} />
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-gray-600">
                            {formatDateTime(post.scheduledAt)}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex flex-wrap justify-end gap-2">
                                {post.status === "draft" ? (
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() =>
                                      void runAction(() => submitForReview({ id: post.id }))
                                    }
                                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Submit for review
                                  </button>
                                ) : null}

                                {post.status === "review" && canApproveReview ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isWorking}
                                      onClick={() =>
                                        void runAction(() => approvePost({ id: post.id }))
                                      }
                                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isWorking}
                                      onClick={() =>
                                        void runAction(() => rejectPost({ id: post.id }))
                                      }
                                      className="rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : null}

                                {post.status === "approved" ? (
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() => startScheduling(post)}
                                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Schedule
                                  </button>
                                ) : null}

                                {post.status === "failed" ? (
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() =>
                                      void runAction(() =>
                                        schedulePost({ id: post.id, scheduledAt: retryValue }),
                                      )
                                    }
                                    className="rounded-xl border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Retry
                                  </button>
                                ) : null}
                              </div>

                              {post.status === "review" && !canApproveReview ? (
                                <p className="text-xs text-gray-500">
                                  Approval actions are limited to admins and content managers.
                                </p>
                              ) : null}

                              {isRowScheduling ? (
                                <div className="w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 p-3">
                                  <label
                                    htmlFor={`schedule-${post.id}`}
                                    className="mb-2 block text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                  >
                                    Choose date and time
                                  </label>
                                  <input
                                    id={`schedule-${post.id}`}
                                    type="datetime-local"
                                    value={scheduleValue}
                                    onChange={(event) => setScheduleValue(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                  />
                                  <div className="mt-3 flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSchedulingPostId(null);
                                        setScheduleValue("");
                                      }}
                                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!scheduleValue || isScheduling}
                                      onClick={() =>
                                        void runAction(async () => {
                                          await schedulePost({
                                            id: post.id,
                                            scheduledAt: toIsoString(scheduleValue),
                                          });
                                          setSchedulingPostId(null);
                                          setScheduleValue("");
                                        })
                                      }
                                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isScheduling ? "Scheduling..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        isSubmitting={isCreating}
        error={createError}
        form={createForm}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetCreateForm();
        }}
        onChange={handleCreateFormChange}
        onTogglePlatform={togglePlatform}
        onSubmit={handleCreatePost}
      />
    </>
  );
}
