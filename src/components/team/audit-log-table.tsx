"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useAuditLog } from "@/hooks/use-team";

interface AuditLogTableProps {
  workspaceId: string;
}

const ACTION_LABELS: Record<string, string> = {
  "member.invited": "Invited member",
  "member.role_updated": "Updated role",
  "post.status_changed": "Post status changed",
  "content.post.status_changed": "Post status changed",
  "campaign.created": "Campaign created",
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return format(date, "MMM d, yyyy 'at' h:mm a");
}

function getActionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function getActorLabel(entry: {
  actorId?: string | null;
  payload?: Record<string, unknown>;
}) {
  if (!entry.actorId) {
    return "System";
  }

  const actorEmail = entry.payload?.actorEmail;

  if (typeof actorEmail === "string" && actorEmail.trim()) {
    return actorEmail;
  }

  return entry.actorId;
}

function getEntityLabel(entry: {
  entityType?: string | null;
  entityId?: string | null;
}) {
  const entityType = typeof entry.entityType === "string" && entry.entityType.trim()
    ? entry.entityType
    : "unknown";
  const entityId = typeof entry.entityId === "string" && entry.entityId.trim()
    ? entry.entityId.slice(0, 8)
    : "n/a";

  return `${entityType} ${entityId}`;
}

export function AuditLogTable({ workspaceId }: AuditLogTableProps) {
  const [page, setPage] = useState(1);
  const { entries, meta, isLoading } = useAuditLog(page);

  useEffect(() => {
    setPage(1);
  }, [workspaceId]);

  const total = meta?.total ?? 0;
  const limit = meta?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = total === 0 ? 0 : Math.min(page * limit, total);
  const isLastPage = page >= totalPages;

  const rows = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        actorLabel: getActorLabel(entry),
        actionLabel: getActionLabel(entry.action),
        entityLabel: getEntityLabel(entry),
        formattedDate: formatDateTime(entry.createdAt),
      })),
    [entries],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date/time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Details
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`audit-log-skeleton-${index}`}>
                    <td className="px-4 py-4">
                      <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  No activity recorded yet
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? rows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                      {entry.formattedDate}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{entry.actorLabel}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {entry.actionLabel}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{entry.entityLabel}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-blue-700">
                          View details
                        </summary>
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-gray-950 p-3 text-xs text-gray-100">
                          {JSON.stringify(entry.payload ?? {}, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4">
        <p className="text-sm text-gray-600">
          Showing {from}–{to} of {total}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
            disabled={isLastPage}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
