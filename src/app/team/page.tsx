"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getCurrentWorkspaceId, type TeamRole } from "@/lib/api-client";
import { useMembers, useRoles } from "@/hooks/use-team";
import { InviteMemberModal } from "@/components/team/invite-member-modal";
import { MemberRow } from "@/components/team/member-row";
import { AuditLogTable } from "@/components/team/audit-log-table";

export default function TeamPage() {
  const { user } = useAuth();
  const { members, error, isLoading, mutate } = useMembers();
  const { roles } = useRoles();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const currentUserId =
    user?.id ??
    (typeof user?.userId === "string" ? user.userId : null);
  const currentMember = members.find((member) => member.userId === currentUserId);
  const currentUserRole: TeamRole = currentMember?.role ?? "analyst";
  const workspaceId = getCurrentWorkspaceId(user) ?? "";

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Team</h1>
          <p className="mt-1 text-sm text-gray-600">{members.length} members</p>
        </div>

        {currentMember?.role === "admin" ? (
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Invite member
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load team members — try refreshing the page.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Access
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`member-skeleton-${index}`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="ml-auto h-10 w-32 animate-pulse rounded-xl bg-gray-200" />
                      </td>
                    </tr>
                  ))
                : null}

              {!isLoading && members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No team members yet — invite your first member
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                      availableRoles={roles}
                      onRoleChange={() => {
                        void mutate();
                      }}
                    />
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">Activity log</h2>
          <p className="mt-1 text-sm text-gray-600">
            Recent workspace activity from team invites, role updates, and related operations.
          </p>
        </div>

        <AuditLogTable workspaceId={workspaceId} />
      </section>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        availableRoles={roles}
        onSuccess={() => {
          void mutate();
        }}
      />
    </div>
  );
}
