"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type MemberStatus, type TeamMember, type TeamRole } from "@/lib/api-client";
import { type ResolvedTeamRoleOption, useUpdateRole, useUpdateStatus } from "@/hooks/use-team";

interface MemberRowProps {
  member: TeamMember;
  currentUserRole: TeamRole;
  currentUserId: string | null;
  availableRoles: ResolvedTeamRoleOption[];
  onRoleChange: () => void;
}

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  analyst: "Analyst",
  content_manager: "Content Manager",
};

const ROLE_BADGE_STYLES: Record<TeamRole, string> = {
  admin: "border-purple-200 bg-purple-50 text-purple-700",
  analyst: "border-blue-200 bg-blue-50 text-blue-700",
  content_manager: "border-teal-200 bg-teal-50 text-teal-700",
};

const STATUS_LABELS = {
  active: "Active",
  invited: "Pending",
  suspended: "Suspended",
} as const;

const STATUS_BADGE_STYLES = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  invited: "border-amber-200 bg-amber-50 text-amber-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
} as const;

export function MemberRow({
  member,
  currentUserRole,
  currentUserId,
  availableRoles,
  onRoleChange,
}: MemberRowProps) {
  const { updateRole, isUpdating } = useUpdateRole();
  const { updateStatus, isUpdatingStatus } = useUpdateStatus();
  const [selectedRole, setSelectedRole] = useState<TeamRole>(member.role);
  const [selectedStatus, setSelectedStatus] = useState<MemberStatus>(member.status);
  const [toastMessage, setToastMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedRole(member.role);
  }, [member.role]);

  useEffect(() => {
    setSelectedStatus(member.status);
  }, [member.status]);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function getEmail() {
    return typeof member.email === "string" ? member.email.trim() : "";
  }

  function getDisplayName() {
    const name = typeof member.name === "string" ? member.name.trim() : "";
    return name || getEmail() || "Unknown member";
  }

  function getInitials() {
    const source = getDisplayName();
    return source.charAt(0).toUpperCase() || "?";
  }

  function getRoleLabel(role: TeamRole) {
    return availableRoles.find((option) => option.value === role)?.label ?? ROLE_LABELS[role];
  }

  function showToast(message: string) {
    setToastMessage(message);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 3000);
  }

  async function handleRoleChange(nextRole: TeamRole) {
    const previousRole = selectedRole;
    setSelectedRole(nextRole);

    try {
      await updateRole({
        memberId: member.id,
        role: nextRole,
      });

      onRoleChange();
    } catch {
      setSelectedRole(previousRole);
      showToast("Failed to update member role");
    }
  }

  async function handleStatusChange(nextStatus: MemberStatus) {
    const previousStatus = selectedStatus;
    setSelectedStatus(nextStatus);

    try {
      await updateStatus({
        memberId: member.id,
        status: nextStatus,
      });

      onRoleChange();
    } catch {
      setSelectedStatus(previousStatus);
      showToast("Failed to update member status");
    }
  }

  const canManageStatus =
    currentUserRole === "admin" && member.userId !== currentUserId;

  return (
    <>
      <tr className="border-b border-gray-100 last:border-b-0">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
              {getInitials()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {getDisplayName()}
              </p>
              <p className="truncate text-sm text-gray-500">{getEmail() || "No email available"}</p>
            </div>
          </div>
        </td>

        <td className="px-4 py-4 text-sm text-gray-600">{getEmail() || "No email available"}</td>

        <td className="px-4 py-4">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ROLE_BADGE_STYLES[selectedRole]}`}
          >
            {getRoleLabel(selectedRole)}
          </span>
        </td>

        <td className="px-4 py-4">
          <div className="flex flex-col items-start gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[selectedStatus]}`}
            >
              {STATUS_LABELS[selectedStatus]}
            </span>

            {canManageStatus ? (
              <select
                value={selectedStatus}
                disabled={isUpdatingStatus}
                onChange={(event) => void handleStatusChange(event.target.value as MemberStatus)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`Change status for ${getDisplayName()}`}
              >
                <option value="invited">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            ) : null}
          </div>
        </td>

        <td className="px-4 py-4 text-right">
          {currentUserRole === "admin" ? (
            <select
              value={selectedRole}
              disabled={isUpdating}
              onChange={(event) => void handleRoleChange(event.target.value as TeamRole)}
              className="w-full max-w-[180px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Change role for ${getDisplayName()}`}
            >
              {availableRoles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </td>
      </tr>

      {mounted && toastMessage
        ? createPortal(
            <div className="fixed right-4 bottom-4 z-50 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-lg">
              {toastMessage}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
