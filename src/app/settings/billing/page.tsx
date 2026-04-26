"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CreditCard } from "lucide-react";
import { useCancelSubscription, useSubscription } from "@/hooks/use-billing";
import { ApiError, api, type Subscription } from "@/lib/api-client";

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID?.trim() || "";
const ENTERPRISE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID?.trim() || "";

const STATUS_STYLES: Record<Subscription["status"], string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  past_due: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  trialing: "border-blue-200 bg-blue-50 text-blue-700",
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

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: Subscription["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-80 animate-pulse rounded bg-gray-100" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl bg-gray-50 p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-6 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { subscription, error, isLoading } = useSubscription();
  const { cancelSubscription, isCancelling } = useCancelSubscription();
  const [checkoutError, setCheckoutError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const showSuccess = searchParams.get("success") === "true";
  const showCancelled = searchParams.get("cancelled") === "true";

  async function handleCheckout(priceId: string) {
    setCheckoutError("");

    if (!priceId) {
      setCheckoutError("Stripe price ID is not configured for this plan.");
      return;
    }

    setIsStartingCheckout(true);

    try {
      await api.createCheckout(priceId);
    } catch (checkoutRequestError) {
      setCheckoutError(getErrorMessage(checkoutRequestError));
      setIsStartingCheckout(false);
    }
  }

  async function handleCancel() {
    setCancelError("");

    if (!window.confirm("Cancel your subscription at the end of the current billing period?")) {
      return;
    }

    try {
      await cancelSubscription();
    } catch (cancelRequestError) {
      setCancelError(getErrorMessage(cancelRequestError));
    }
  }

  if (isLoading) {
    return <BillingSkeleton />;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">Billing</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review your current plan, manage renewals, and upgrade workspace access.
        </p>
      </div>

      {showSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Checkout completed successfully. Your billing details should refresh shortly.
        </div>
      ) : null}

      {showCancelled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Checkout was cancelled before confirmation.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load subscription details — try refreshing the page.
        </div>
      ) : null}

      {checkoutError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {checkoutError}
        </div>
      ) : null}

      {cancelError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {cancelError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-950">Current subscription</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Active workspace billing configuration and renewal dates.
                </p>
              </div>
            </div>
          </div>

          {subscription ? <StatusBadge status={subscription.status} /> : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plan</div>
            <div className="mt-2 text-xl font-semibold capitalize text-gray-950">
              {subscription?.plan ?? "Unknown"}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Renewal date</div>
            <div className="mt-2 text-xl font-semibold text-gray-950">
              {formatDate(subscription?.currentPeriodEnd ?? null)}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cancel at</div>
            <div className="mt-2 text-xl font-semibold text-gray-950">
              {formatDate(subscription?.cancelAt ?? null)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {subscription?.plan === "starter" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-950">Upgrade to Pro</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Unlock alerts, approvals, campaign workflows, and expanded team collaboration.
            </p>
            <button
              type="button"
              onClick={() => {
                void handleCheckout(PRO_PRICE_ID);
              }}
              disabled={isStartingCheckout}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStartingCheckout ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </div>
        ) : null}

        {subscription?.plan === "pro" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-950">Upgrade to Enterprise</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Add enterprise billing, advanced controls, and higher-scale workspace operations.
            </p>
            <button
              type="button"
              onClick={() => {
                void handleCheckout(ENTERPRISE_PRICE_ID);
              }}
              disabled={isStartingCheckout}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStartingCheckout ? "Redirecting..." : "Upgrade to Enterprise"}
            </button>
          </div>
        ) : null}

        {subscription?.status === "active" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">Cancel subscription</h2>
                <p className="mt-2 text-sm leading-6 text-red-800">
                  Cancelling will stop renewal and preserve access until the current billing period ends.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void handleCancel();
                  }}
                  disabled={isCancelling}
                  className="mt-6 inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCancelling ? "Cancelling..." : "Cancel subscription"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
