"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";
import {
  api,
  type CreateCampaignInput,
} from "@/lib/api-client";

function isCampaignsKey(key: unknown) {
  if (typeof key === "string") {
    return key === "campaigns";
  }

  return Array.isArray(key) && key[0] === "campaigns";
}

export function useCampaigns() {
  const { data, error, isLoading, mutate } = useSWR(
    "campaigns",
    () => api.getCampaigns(),
  );

  return {
    campaigns: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useCampaign(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ["campaigns", id],
    () => api.getCampaign(id),
  );

  return {
    campaign: data,
    error,
    isLoading,
    mutate,
  };
}

export function useCreateCampaign() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "campaigns",
    (_, { arg }: { arg: CreateCampaignInput }) => api.createCampaign(arg),
  );

  const createCampaign = async (input: CreateCampaignInput) => {
    const result = await trigger(input);
    await mutate(isCampaignsKey);
    return result;
  };

  return { createCampaign, isCreating: isMutating };
}

export function useUpdateCampaign() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "campaigns",
    (_, { arg }: { arg: { id: string; data: Partial<CreateCampaignInput> } }) =>
      api.updateCampaign(arg.id, arg.data),
  );

  const updateCampaign = async (id: string, data: Partial<CreateCampaignInput>) => {
    const result = await trigger({ id, data });
    await mutate(isCampaignsKey);
    return result;
  };

  return { updateCampaign, isUpdating: isMutating };
}

export function useDeleteCampaign() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "campaigns",
    (_, { arg }: { arg: { id: string } }) => api.deleteCampaign(arg.id),
  );

  const deleteCampaign = async (id: string) => {
    const result = await trigger({ id });
    await mutate(isCampaignsKey);
    return result;
  };

  return { deleteCampaign, isDeleting: isMutating };
}
