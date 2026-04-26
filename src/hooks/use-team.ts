"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import {
  api,
  type InviteMemberInput,
  type MemberStatus,
  type TeamMember,
  type TeamRole,
  type TeamRoleOption,
} from "@/lib/api-client";

export interface ResolvedTeamRoleOption {
  value: TeamRole;
  label: string;
  description: string;
  permissions: string[];
}

const FALLBACK_ROLE_OPTIONS: ResolvedTeamRoleOption[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access — manage team, billing, all content",
    permissions: [],
  },
  {
    value: "analyst",
    label: "Analyst",
    description: "Read-only access to analytics and reports",
    permissions: [],
  },
  {
    value: "content_manager",
    label: "Content Manager",
    description: "Create and schedule content, manage inbox",
    permissions: [],
  },
];

function normalizeRole(value: string | undefined | null): TeamRole | null {
  if (value === "admin" || value === "analyst" || value === "content_manager") {
    return value;
  }

  return null;
}

function normalizeStatus(value: string | undefined | null): MemberStatus {
  if (value === "active" || value === "invited" || value === "suspended") {
    return value;
  }

  return "invited";
}

function normalizeMember(member: TeamMember): TeamMember {
  const role = normalizeRole(member.role) ?? "analyst";

  return {
    ...member,
    id:
      (typeof member.id === "string" && member.id.trim()) ||
      (typeof member.userId === "string" && member.userId.trim()) ||
      (typeof member.email === "string" && member.email.trim()) ||
      (typeof member.invitedAt === "string" && member.invitedAt.trim()) ||
      "unknown-member",
    userId: typeof member.userId === "string" ? member.userId : "",
    email: typeof member.email === "string" ? member.email : null,
    name: typeof member.name === "string" ? member.name : null,
    role,
    status: normalizeStatus(member.status),
    invitedAt: typeof member.invitedAt === "string" ? member.invitedAt : "",
    acceptedAt: typeof member.acceptedAt === "string" ? member.acceptedAt : null,
  };
}

function normalizeRoleOption(option: TeamRoleOption): ResolvedTeamRoleOption | null {
  const value = normalizeRole(option.value ?? option.role ?? option.key ?? null);

  if (!value) {
    return null;
  }

  return {
    value,
    label:
      (typeof option.label === "string" && option.label.trim()) ||
      (typeof option.name === "string" && option.name.trim()) ||
      FALLBACK_ROLE_OPTIONS.find((entry) => entry.value === value)?.label ||
      value,
    description:
      (typeof option.description === "string" && option.description.trim()) ||
      FALLBACK_ROLE_OPTIONS.find((entry) => entry.value === value)?.description ||
      "",
    permissions: Array.isArray(option.permissions)
      ? option.permissions.filter((permission): permission is string => typeof permission === "string")
      : [],
  };
}

export function useMembers() {
  const { data, error, isLoading, mutate } = useSWR(
    "team/members",
    () => api.getMembers(),
  );

  return {
    members: Array.isArray(data) ? data.map(normalizeMember) : [],
    error,
    isLoading,
    mutate,
  };
}

export function useInviteMember() {
  const { trigger, isMutating } = useSWRMutation(
    "team/members",
    (_, { arg }: { arg: InviteMemberInput }) => api.inviteMember(arg),
  );

  return { invite: trigger, isInviting: isMutating };
}

export function useUpdateRole() {
  const { trigger, isMutating } = useSWRMutation(
    "team/members",
    (_, { arg }: { arg: { memberId: string; role: TeamRole } }) =>
      api.updateMemberRole(arg.memberId, arg.role),
  );

  return { updateRole: trigger, isUpdating: isMutating };
}

export function useUpdateStatus() {
  const { trigger, isMutating } = useSWRMutation(
    "team/members",
    (_, { arg }: { arg: { memberId: string; status: MemberStatus } }) =>
      api.updateMemberStatus(arg.memberId, arg.status),
  );

  return { updateStatus: trigger, isUpdatingStatus: isMutating };
}

export function useRoles() {
  const { data, error, isLoading } = useSWR(
    "team/roles",
    () => api.getRoles(),
  );

  const roles = Array.isArray(data)
    ? data
        .map(normalizeRoleOption)
        .filter((option): option is ResolvedTeamRoleOption => option != null)
    : [];

  return {
    roles: roles.length > 0 ? roles : FALLBACK_ROLE_OPTIONS,
    error,
    isLoading,
  };
}

export function useAuditLog(page: number) {
  const { data, error, isLoading } = useSWR(
    ["team/audit-log", page],
    () => api.getAuditLog(page),
  );

  return {
    entries: data?.data ?? [],
    meta: data?.meta,
    error,
    isLoading,
  };
}
