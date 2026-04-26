"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";
import {
  api,
  type InboxThread,
  type UpdateInboxThreadInput,
} from "@/lib/api-client";

function isThreadsKey(key: unknown) {
  if (typeof key === "string") {
    return key === "inbox/threads";
  }

  return Array.isArray(key) && key[0] === "inbox/threads";
}

function isThreadKey(key: unknown) {
  return Array.isArray(key) && key[0] === "inbox/thread";
}

function isMessagesKey(key: unknown) {
  return Array.isArray(key) && key[0] === "inbox/messages";
}

function isThreadIdKey(key: unknown, id: string) {
  return Array.isArray(key) && key[0] === "inbox/thread" && key[1] === id;
}

function isMessagesThreadKey(key: unknown, threadId: string) {
  return Array.isArray(key) && key[0] === "inbox/messages" && key[1] === threadId;
}

export function useThreads(params?: { status?: string; platform?: string; page?: number }) {
  const { data, error, isLoading, mutate } = useSWR(
    ["inbox/threads", params],
    () => api.getThreads(params),
  );

  return {
    threads: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useThread(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ["inbox/thread", id],
    () => api.getThread(id),
  );

  return {
    thread: data,
    error,
    isLoading,
    mutate,
  };
}

export function useMessages(threadId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ["inbox/messages", threadId],
    () => api.getMessages(threadId),
  );

  return {
    messages: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useSendReply() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "inbox/reply",
    (_, { arg }: { arg: { threadId: string; body: string } }) =>
      api.sendReply(arg.threadId, arg.body),
  );

  const sendReply = async (threadId: string, body: string) => {
    const result = await trigger({ threadId, body });
    await mutate(isThreadsKey);
    await mutate((key) => isThreadKey(key) || isMessagesThreadKey(key, threadId));
    return result;
  };

  return { sendReply, isSending: isMutating };
}

export function useUpdateThread() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "inbox/thread/update",
    (_, { arg }: { arg: { id: string; data: UpdateInboxThreadInput } }) =>
      api.updateThread(arg.id, arg.data),
  );

  const updateThread = async (id: string, data: UpdateInboxThreadInput) => {
    const result = await trigger({ id, data });
    await mutate(isThreadsKey);
    await mutate((key) => isThreadIdKey(key, id));
    return result as InboxThread;
  };

  return { updateThread, isUpdating: isMutating };
}
