"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useSWRMutation from "swr/mutation";
import { ArrowLeft, Link2 } from "lucide-react";
import { useCampaign } from "@/hooks/use-campaigns";
import { usePosts } from "@/hooks/use-schedule";
import {
  ApiError,
  api,
  type Campaign,
  type Post,
  type PostPlatform,
} from "@/lib/api-client";

type LinkedCampaignPost = Post & {
  campaignId?: string | null;
};

type CampaignDetail = Campaign & {
  posts?: LinkedCampaignPost[];
  linkedPosts?: Array<string | LinkedCampaignPost>;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "border-gray-200 bg-gray-100 text-gray-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  published: "border-indigo-200 bg-indigo-50 text-indigo-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const PLATFORM_STYLES: Record<PostPlatform, string> = {
  facebook: "bg-blue-50 text-blue-700",
  instagram: "bg-pink-50 text-pink-700",
  linkedin: "bg-sky-50 text-sky-700",
  tiktok: "bg-slate-100 text-slate-700",
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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

function StatusBadge({ status }: { status: Post["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
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
        PLATFORM_STYLES[platform],
      )}
    >
      {platform}
    </span>
  );
}

function normalizeLinkedPosts(campaign: CampaignDetail | undefined, posts: Post[]) {
  if (!campaign) {
    return [] as LinkedCampaignPost[];
  }

  if (Array.isArray(campaign.posts)) {
    return campaign.posts.filter(
      (post): post is LinkedCampaignPost =>
        post != null && typeof post === "object" && typeof post.id === "string",
    );
  }

  if (Array.isArray(campaign.linkedPosts)) {
    return campaign.linkedPosts
      .map((entry) => {
        if (typeof entry === "string") {
          return posts.find((post) => post.id === entry) ?? null;
        }

        if (entry && typeof entry === "object" && typeof entry.id === "string") {
          return entry;
        }

        return null;
      })
      .filter((post): post is LinkedCampaignPost => post != null);
  }

  return (posts as LinkedCampaignPost[]).filter((post) => post.campaignId === campaign.id);
}

function LinkPostModal({
  isOpen,
  isSubmitting,
  error,
  availablePosts,
  selectedPostId,
  onClose,
  onSelect,
  onSubmit,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string;
  availablePosts: Post[];
  selectedPostId: string;
  onClose: () => void;
  onSelect: (postId: string) => void;
  onSubmit: () => void;
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
            <h2 className="text-xl font-semibold text-gray-950">Link post</h2>
            <p className="mt-1 text-sm text-gray-600">
              Attach an existing scheduled or published post to this campaign.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close link post modal"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {availablePosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
              No available posts to link.
            </div>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto">
              {availablePosts.map((post) => {
                const selected = selectedPostId === post.id;

                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelect(post.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-950">{post.title}</div>
                        <div className="mt-1 text-sm text-gray-500">{post.caption}</div>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.platforms.map((platform) => (
                        <PlatformBadge key={`${post.id}-${platform}`} platform={platform} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedPostId || isSubmitting || availablePosts.length === 0}
              onClick={onSubmit}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Linking..." : "Link post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const campaignId = typeof params?.id === "string" ? params.id : "";
  const { campaign, error, isLoading, mutate } = useCampaign(campaignId);
  const { posts, mutate: mutatePosts } = usePosts();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [linkError, setLinkError] = useState("");

  const detail = campaign as CampaignDetail | undefined;
  const linkedPosts = useMemo(
    () => normalizeLinkedPosts(detail, posts),
    [detail, posts],
  );
  const linkedPostIds = useMemo(
    () => new Set(linkedPosts.map((post) => post.id)),
    [linkedPosts],
  );
  const availablePosts = useMemo(
    () => posts.filter((post) => !linkedPostIds.has(post.id)),
    [linkedPostIds, posts],
  );

  const { trigger: linkPost, isMutating: isLinking } = useSWRMutation(
    campaignId ? ["campaigns", campaignId, "link-post"] : null,
    (_, { arg }: { arg: { postId: string } }) => api.linkPost(campaignId, arg.postId),
  );

  async function handleLinkPost() {
    if (!selectedPostId) {
      return;
    }

    setLinkError("");

    try {
      await linkPost({ postId: selectedPostId });
      await Promise.all([mutate(), mutatePosts()]);
      setSelectedPostId("");
      setIsLinkModalOpen(false);
    } catch (mutationError) {
      setLinkError(getErrorMessage(mutationError));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-96 animate-pulse rounded bg-gray-100" />
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl bg-gray-50 p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-6 w-16 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6 pb-10">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to campaigns
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load campaign details — try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-10">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to campaigns
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                {detail.platforms.map((platform) => (
                  <PlatformBadge key={`${detail.id}-${platform}`} platform={platform} />
                ))}
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-gray-950">{detail.name}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {detail.objective}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setLinkError("");
                setSelectedPostId(availablePosts[0]?.id ?? "");
                setIsLinkModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Link2 size={16} />
              Link post
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total posts
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">
                {detail.totalPosts}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Published
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">
                {detail.publishedPosts}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reach
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">
                {detail.totalReach.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Revenue
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">
                {formatCurrency(detail.totalRevenue)}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-950">Linked posts</h2>
            <p className="mt-1 text-sm text-gray-600">
              Posts currently attached to this campaign.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {linkedPosts.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-500">
                No linked posts yet.
              </div>
            ) : (
              linkedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-950">{post.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{post.caption}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.platforms.map((platform) => (
                        <PlatformBadge key={`${post.id}-${platform}`} platform={platform} />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <StatusBadge status={post.status} />
                    <div className="text-sm text-gray-500">
                      {formatDateTime(post.scheduledAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <LinkPostModal
        isOpen={isLinkModalOpen}
        isSubmitting={isLinking}
        error={linkError}
        availablePosts={availablePosts}
        selectedPostId={selectedPostId}
        onClose={() => {
          setIsLinkModalOpen(false);
          setSelectedPostId("");
          setLinkError("");
        }}
        onSelect={setSelectedPostId}
        onSubmit={() => {
          void handleLinkPost();
        }}
      />
    </>
  );
}
