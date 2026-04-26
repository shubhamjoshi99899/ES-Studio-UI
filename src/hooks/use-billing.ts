"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";
import { api } from "@/lib/api-client";

function isSubscriptionKey(key: unknown) {
  if (typeof key === "string") {
    return key === "billing/subscription";
  }

  return Array.isArray(key) && key[0] === "billing/subscription";
}

export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR(
    "billing/subscription",
    api.getSubscription,
  );

  return {
    subscription: data,
    error,
    isLoading,
    mutate,
  };
}

export function useCancelSubscription() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "billing/subscription",
    () => api.cancelSubscription(),
  );

  const cancelSubscription = async () => {
    const result = await trigger();
    await mutate(isSubscriptionKey);
    return result;
  };

  return { cancelSubscription, isCancelling: isMutating };
}
