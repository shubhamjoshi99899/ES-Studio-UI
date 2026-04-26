"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";
import {
  api,
  type CreateAlertRuleInput,
} from "@/lib/api-client";

function isAlertRulesKey(key: unknown) {
  if (typeof key === "string") {
    return key === "alerts/rules";
  }

  return Array.isArray(key) && key[0] === "alerts/rules";
}

function isNotificationsKey(key: unknown) {
  if (typeof key === "string") {
    return key === "notifications";
  }

  return Array.isArray(key) && key[0] === "notifications";
}

export function useAlertRules() {
  const { data, error, isLoading, mutate } = useSWR(
    "alerts/rules",
    () => api.getAlertRules(),
  );

  return {
    alertRules: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useCreateAlertRule() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "alerts/rules",
    (_, { arg }: { arg: CreateAlertRuleInput }) => api.createAlertRule(arg),
  );

  const createAlertRule = async (input: CreateAlertRuleInput) => {
    const result = await trigger(input);
    await mutate(isAlertRulesKey);
    return result;
  };

  return { createAlertRule, isCreating: isMutating };
}

export function useUpdateAlertRule() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "alerts/rules",
    (_, { arg }: { arg: { id: string; data: Partial<CreateAlertRuleInput> } }) =>
      api.updateAlertRule(arg.id, arg.data),
  );

  const updateAlertRule = async (id: string, data: Partial<CreateAlertRuleInput>) => {
    const result = await trigger({ id, data });
    await mutate(isAlertRulesKey);
    return result;
  };

  return { updateAlertRule, isUpdating: isMutating };
}

export function useDeleteAlertRule() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "alerts/rules",
    (_, { arg }: { arg: { id: string } }) => api.deleteAlertRule(arg.id),
  );

  const deleteAlertRule = async (id: string) => {
    const result = await trigger({ id });
    await mutate(isAlertRulesKey);
    return result;
  };

  return { deleteAlertRule, isDeleting: isMutating };
}

export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR(
    "alerts/insights",
    () => api.getInsights(),
  );

  return {
    insights: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR(
    "notifications",
    () => api.getNotifications(),
  );

  return {
    notifications: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useMarkAllRead() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "notifications",
    () => api.markAllRead(),
  );

  const markAllRead = async () => {
    const result = await trigger();
    await mutate(isNotificationsKey);
    return result;
  };

  return { markAllRead, isMarkingAllRead: isMutating };
}
