"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";
import {
  api,
  type CreatePostInput,
} from "@/lib/api-client";

function isPostsKey(key: unknown) {
  if (typeof key === "string") {
    return key === "schedule/posts";
  }

  return Array.isArray(key) && key[0] === "schedule/posts";
}

export function usePosts(params?: { status?: string; platform?: string }) {
  const { data, error, isLoading, mutate } = useSWR(
    ["schedule/posts", params],
    () => api.getPosts(params),
  );

  return {
    posts: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useCreatePost() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "schedule/posts",
    (_, { arg }: { arg: CreatePostInput }) => api.createPost(arg),
  );

  const createPost = async (input: CreatePostInput) => {
    const result = await trigger(input);
    await mutate(isPostsKey);
    return result;
  };

  return { createPost, isCreating: isMutating };
}

export function useUpdatePost() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "schedule/posts",
    (_, { arg }: { arg: { id: string; data: Partial<CreatePostInput> } }) =>
      api.updatePost(arg.id, arg.data),
  );

  const updatePost = async (id: string, data: Partial<CreatePostInput>) => {
    const result = await trigger({ id, data });
    await mutate(isPostsKey);
    return result;
  };

  return { updatePost, isUpdating: isMutating };
}

export function useDeletePost() {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = useSWRMutation(
    "schedule/posts",
    (_, { arg }: { arg: { id: string } }) => api.deletePost(arg.id),
  );

  const deletePost = async (id: string) => {
    const result = await trigger({ id });
    await mutate(isPostsKey);
    return result;
  };

  return { deletePost, isDeleting: isMutating };
}
