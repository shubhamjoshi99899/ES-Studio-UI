"use client";

import Link from "next/link";
import { BellRing, TrendingDown, TrendingUp } from "lucide-react";
import { useAlertRules, useInsights, useUpdateAlertRule } from "@/hooks/use-alerts";
import { useSubscription } from "@/hooks/use-billing";
import { ApiError, type AlertRule, type InsightCard } from "@/lib/api-client";

const INSIGHT_CARD_STYLES: Record<InsightCard["severity"], string> = {
  positive: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  critical: "border-red-200 bg-red-50",
  neutral: "border-gray-200 bg-gray-50",
};

const INSIGHT_PILL_STYLES: Record<InsightCard["severity"], string> = {
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
  neutral: "bg-gray-200 text-gray-700",
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

function formatRuleMetric(rule: AlertRule) {
  return `${rule.metricFamily} · ${rule.timeWindow}`;
}

function formatRuleOperator(rule: AlertRule) {
  const labels: Record<AlertRule["operator"], string> = {
    gt: "Greater than",
    lt: "Less than",
    pct_drop: "% drop",
    pct_rise: "% rise",
  };

  return labels[rule.operator];
}

function formatInsightDate(value: string) {
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

function RulesTableSkeleton() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={`rule-skeleton-${index}`} className="border-t border-gray-100">
      <td className="px-4 py-4">
        <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-4">
        <div className="ml-auto h-6 w-12 animate-pulse rounded-full bg-gray-200" />
      </td>
    </tr>
  ));
}

function InsightsSkeleton() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div
      key={`insight-skeleton-${index}`}
      className="rounded-2xl border border-gray-200 bg-white p-5"
    >
      <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-5 w-56 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  ));
}

function UpgradePrompt() {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-10">
      <div className="max-w-2xl">
        <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
          Pro feature
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-gray-950">Upgrade to unlock alerts and insights</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Custom alert rules, automated anomaly detection, and insight cards are available on Pro and Enterprise plans.
        </p>
        <div className="mt-6">
          <Link
            href="/settings/billing"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Upgrade plan
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { subscription, error: subscriptionError, isLoading: isSubscriptionLoading } = useSubscription();
  const { alertRules, error: rulesError, isLoading: isRulesLoading, mutate: mutateRules } = useAlertRules();
  const { insights, error: insightsError, isLoading: isInsightsLoading } = useInsights();
  const { updateAlertRule, isUpdating } = useUpdateAlertRule();

  async function handleToggleRule(rule: AlertRule) {
    try {
      await updateAlertRule(rule.id, { enabled: !rule.enabled });
      await mutateRules();
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  }

  if (isSubscriptionLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-gray-100" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (subscription?.plan === "starter") {
    return <UpgradePrompt />;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">Alerts & Insights</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor anomaly rules and review automatically generated insight cards across the workspace.
        </p>
      </div>

      {subscriptionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load subscription details.
        </div>
      ) : null}

      {rulesError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load alert rules — try refreshing the page.
        </div>
      ) : null}

      {insightsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load insight cards — try refreshing the page.
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-950">Alert rules</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure thresholds for traffic, engagement, and revenue changes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Metric
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Operator
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Threshold
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Enabled
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {isRulesLoading ? <RulesTableSkeleton /> : null}

              {!isRulesLoading && alertRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    No alert rules configured yet.
                  </td>
                </tr>
              ) : null}

              {!isRulesLoading
                ? alertRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-4 text-sm font-medium text-gray-950">{rule.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatRuleMetric(rule)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatRuleOperator(rule)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{rule.threshold}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={rule.enabled}
                            disabled={isUpdating}
                            onClick={() => {
                              void handleToggleRule(rule);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              rule.enabled ? "bg-blue-600" : "bg-gray-300"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                rule.enabled ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">Insight cards</h2>
          <p className="mt-1 text-sm text-gray-600">
            High-signal observations generated from workspace performance changes.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {isInsightsLoading ? <InsightsSkeleton /> : null}

          {!isInsightsLoading && insights.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500">
              No insights available right now.
            </div>
          ) : null}

          {!isInsightsLoading
            ? insights.map((insight) => (
                <article
                  key={insight.id}
                  className={`rounded-2xl border p-5 ${INSIGHT_CARD_STYLES[insight.severity]}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${INSIGHT_PILL_STYLES[insight.severity]}`}
                        >
                          {insight.severity}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {insight.type}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-gray-950">{insight.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-700">{insight.body}</p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                        insight.severity === "positive"
                          ? "bg-emerald-100 text-emerald-700"
                          : insight.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {insight.severity === "positive" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {insight.severity}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <BellRing size={14} />
                      Generated insight
                    </div>
                    <span>{formatInsightDate(insight.createdAt)}</span>
                  </div>
                </article>
              ))
            : null}
        </div>
      </section>
    </div>
  );
}
