"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarRange, FolderKanban, Layers3, Users2 } from "lucide-react";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useSubscription } from "@/hooks/use-billing";
import { usePosts } from "@/hooks/use-schedule";
import { useMembers } from "@/hooks/use-team";
import { type Campaign, type PostPlatform } from "@/lib/api-client";

const PLATFORM_BADGE_STYLES: Record<PostPlatform, string> = {
  facebook: "bg-blue-50 text-blue-700",
  instagram: "bg-pink-50 text-pink-700",
  linkedin: "bg-sky-50 text-sky-700",
  tiktok: "bg-slate-100 text-slate-700",
};

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
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function capitalize(value: string | undefined) {
  if (!value) {
    return "—";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function PlatformBadge({ platform }: { platform: PostPlatform }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${PLATFORM_BADGE_STYLES[platform]}`}
    >
      {platform}
    </span>
  );
}

function MetricSkeleton() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div
      key={`metric-skeleton-${index}`}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-20 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  ));
}

function ListSkeleton({ rows }: { rows: number }) {
  return Array.from({ length: rows }).map((_, index) => (
    <div
      key={`list-skeleton-${index}`}
      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-60 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  ));
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold text-gray-950">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function sortScheduledPostsByDate<T extends { scheduledAt: string | null }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftDate = left.scheduledAt ? new Date(left.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDate = right.scheduledAt ? new Date(right.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
    return leftDate - rightDate;
  });
}

function activeCampaignsOnly(items: Campaign[]) {
  return items.filter((campaign) => campaign.status === "active");
}

export default function DashboardPage() {
  const {
    posts,
    isLoading: isPostsLoading,
    error: postsError,
  } = usePosts({ status: "scheduled" });
  const {
    campaigns,
    isLoading: isCampaignsLoading,
    error: campaignsError,
  } = useCampaigns();
  const {
    subscription,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
  } = useSubscription();
  const {
    members,
    isLoading: isMembersLoading,
    error: membersError,
  } = useMembers();

  const upcomingPosts = sortScheduledPostsByDate(posts).slice(0, 5);
  const activeCampaigns = activeCampaignsOnly(campaigns);
  const topCampaigns = activeCampaigns.slice(0, 3);
  const isMetricsLoading =
    isPostsLoading || isCampaignsLoading || isSubscriptionLoading || isMembersLoading;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Live operational view of scheduled content, campaigns, billing, and team capacity.
        </p>
      </div>

      {postsError || campaignsError || subscriptionError || membersError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Some dashboard data failed to load. Try refreshing the page.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isMetricsLoading ? (
          <MetricSkeleton />
        ) : (
          <>
            <MetricCard
              title="Scheduled posts"
              value={posts.length}
              icon={<CalendarRange size={20} />}
            />
            <MetricCard
              title="Active campaigns"
              value={activeCampaigns.length}
              icon={<FolderKanban size={20} />}
            />
            <MetricCard
              title="Current plan"
              value={capitalize(subscription?.plan)}
              icon={<Layers3 size={20} />}
            />
            <MetricCard
              title="Workspace members"
              value={members.length}
              icon={<Users2 size={20} />}
            />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Upcoming posts</h2>
              <p className="mt-1 text-sm text-gray-600">
                The next scheduled items waiting in the publishing queue.
              </p>
            </div>
            <Link
              href="/schedule"
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {isPostsLoading ? <ListSkeleton rows={5} /> : null}

            {!isPostsLoading && upcomingPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500">
                No posts scheduled — go to Schedule to create one
              </div>
            ) : null}

            {!isPostsLoading
              ? upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-950">{post.title}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {post.platforms.map((platform) => (
                            <PlatformBadge key={`${post.id}-${platform}`} platform={platform} />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(post.scheduledAt)}
                      </div>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Active campaigns</h2>
              <p className="mt-1 text-sm text-gray-600">
                Campaigns currently running across connected publishing workflows.
              </p>
            </div>
            <Link
              href="/campaigns"
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {isCampaignsLoading ? <ListSkeleton rows={3} /> : null}

            {!isCampaignsLoading && topCampaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500">
                No active campaigns
              </div>
            ) : null}

            {!isCampaignsLoading
              ? topCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-950">{campaign.name}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {campaign.platforms.map((platform) => (
                            <PlatformBadge key={`${campaign.id}-${platform}`} platform={platform} />
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{campaign.totalPosts} posts</div>
                        <div className="mt-1 font-medium text-gray-700">
                          {formatCurrency(campaign.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </section>
      </div>
    </div>
  );
}
