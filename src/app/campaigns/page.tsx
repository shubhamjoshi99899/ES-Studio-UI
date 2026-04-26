"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { useCampaigns, useCreateCampaign } from "@/hooks/use-campaigns";
import {
  ApiError,
  type CreateCampaignInput,
  type PostPlatform,
} from "@/lib/api-client";

const PLATFORM_OPTIONS: PostPlatform[] = ["facebook", "instagram", "linkedin", "tiktok"];

const STATUS_STYLES: Record<string, string> = {
  draft: "border-gray-200 bg-gray-100 text-gray-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-blue-200 bg-blue-50 text-blue-700",
};

const PLATFORM_STYLES: Record<PostPlatform, string> = {
  facebook: "bg-blue-50 text-blue-700",
  instagram: "bg-pink-50 text-pink-700",
  linkedin: "bg-sky-50 text-sky-700",
  tiktok: "bg-slate-100 text-slate-700",
};

type CampaignFormState = {
  name: string;
  objective: string;
  platforms: PostPlatform[];
  budget: string;
  startDate: string;
  endDate: string;
};

const EMPTY_FORM: CampaignFormState = {
  name: "",
  objective: "",
  platforms: ["instagram"],
  budget: "",
  startDate: "",
  endDate: "",
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

function formatCurrency(value: number | null) {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }: { status: "draft" | "active" | "completed" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        STATUS_STYLES[status],
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

function LoadingCards() {
  return Array.from({ length: 6 }).map((_, index) => (
    <div
      key={`campaign-skeleton-${index}`}
      className="rounded-2xl border border-gray-200 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
      </div>

      <div className="mt-4 flex gap-2">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((__, metricIndex) => (
          <div key={metricIndex} className="space-y-2 rounded-xl bg-gray-50 p-3">
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  ));
}

function CreateCampaignModal({
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
  form: CampaignFormState;
  onClose: () => void;
  onChange: (field: keyof CampaignFormState, value: string) => void;
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
            <h2 className="text-xl font-semibold text-gray-950">New campaign</h2>
            <p className="mt-1 text-sm text-gray-600">
              Create a campaign with objective, platforms, budget, and flight dates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close create campaign modal"
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

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="campaign-name" className="mb-2 block text-sm font-medium text-gray-700">
                Campaign name
              </label>
              <input
                id="campaign-name"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label htmlFor="campaign-budget" className="mb-2 block text-sm font-medium text-gray-700">
                Budget
              </label>
              <input
                id="campaign-budget"
                type="number"
                min="0"
                value={form.budget}
                onChange={(event) => onChange("budget", event.target.value)}
                placeholder="10000"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="campaign-objective" className="mb-2 block text-sm font-medium text-gray-700">
              Objective
            </label>
            <textarea
              id="campaign-objective"
              rows={4}
              value={form.objective}
              onChange={(event) => onChange("objective", event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
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

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="campaign-start-date" className="mb-2 block text-sm font-medium text-gray-700">
                Start date
              </label>
              <input
                id="campaign-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => onChange("startDate", event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label htmlFor="campaign-end-date" className="mb-2 block text-sm font-medium text-gray-700">
                End date
              </label>
              <input
                id="campaign-end-date"
                type="date"
                value={form.endDate}
                onChange={(event) => onChange("endDate", event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
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
              {isSubmitting ? "Creating..." : "Create campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { campaigns, error, isLoading, mutate } = useCampaigns();
  const { createCampaign, isCreating } = useCreateCampaign();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState<CampaignFormState>(EMPTY_FORM);

  function resetForm() {
    setForm(EMPTY_FORM);
    setCreateError("");
  }

  function handleChange(field: keyof CampaignFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function togglePlatform(platform: PostPlatform) {
    setForm((current) => {
      const nextPlatforms = current.platforms.includes(platform)
        ? current.platforms.filter((value) => value !== platform)
        : [...current.platforms, platform];

      return {
        ...current,
        platforms: nextPlatforms.length > 0 ? nextPlatforms : [platform],
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");

    if (!form.name.trim()) {
      setCreateError("Campaign name is required");
      return;
    }

    if (!form.objective.trim()) {
      setCreateError("Objective is required");
      return;
    }

    if (!form.startDate) {
      setCreateError("Start date is required");
      return;
    }

    if (form.platforms.length === 0) {
      setCreateError("Select at least one platform");
      return;
    }

    try {
      const payload: CreateCampaignInput = {
        name: form.name.trim(),
        objective: form.objective.trim(),
        platforms: form.platforms,
        startDate: form.startDate,
        ...(form.endDate ? { endDate: form.endDate } : {}),
        ...(form.budget ? { budget: Number(form.budget) } : {}),
      };

      await createCampaign(payload);
      await mutate();
      resetForm();
      setIsCreateModalOpen(false);
    } catch (mutationError) {
      setCreateError(getErrorMessage(mutationError));
    }
  }

  return (
    <>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-950">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track campaign execution, reach, and revenue from one live workspace view.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={16} />
            New campaign
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load campaigns — try refreshing the page.
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {isLoading ? <LoadingCards /> : null}

          {!isLoading && campaigns.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-sm text-gray-500">
                <FolderKanban className="h-8 w-8 text-gray-300" />
                <p>No campaigns yet — create your first campaign</p>
              </div>
            </div>
          ) : null}

          {!isLoading
            ? campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-gray-950">
                        {campaign.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">{campaign.objective}</p>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {campaign.platforms.map((platform) => (
                      <PlatformBadge key={`${campaign.id}-${platform}`} platform={platform} />
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Total posts
                      </div>
                      <div className="mt-1 text-base font-semibold text-gray-950">
                        {campaign.totalPosts}
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Published
                      </div>
                      <div className="mt-1 text-base font-semibold text-gray-950">
                        {campaign.publishedPosts}
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Reach
                      </div>
                      <div className="mt-1 text-base font-semibold text-gray-950">
                        {campaign.totalReach.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Revenue
                      </div>
                      <div className="mt-1 text-base font-semibold text-gray-950">
                        {formatCurrency(campaign.totalRevenue)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            : null}
        </div>
      </div>

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        isSubmitting={isCreating}
        error={createError}
        form={form}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        onChange={handleChange}
        onTogglePlatform={togglePlatform}
        onSubmit={handleSubmit}
      />
    </>
  );
}
