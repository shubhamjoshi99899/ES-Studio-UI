"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRevenueMappings, updateRevenueMapping, RevenueMappingRow } from "@/lib/api";
import { ArrowLeft, Plus, X, Tag, Users, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function RevenueMappingsPage() {
  const queryClient = useQueryClient();

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["revenue-mappings"],
    queryFn: fetchRevenueMappings,
  });

  const mutation = useMutation({
    mutationFn: ({ id, team }: { id: number; team: string | null }) =>
      updateRevenueMapping(id, team),
    onSuccess: (data) => {
      queryClient.setQueryData(["revenue-mappings"], data);
    },
  });

  /* ─── Team management state ─── */
  const [newTeamInput, setNewTeamInput] = useState("");
  // Extra teams that user added locally but haven't been assigned yet
  const [localTeams, setLocalTeams] = useState<string[]>([]);

  // Derive the full team list from existing mappings + locally-added teams
  const allTeams = useMemo(() => {
    const fromMappings = mappings
      .map((m) => m.team)
      .filter((t): t is string => !!t && t !== "Unassigned");
    const merged = new Set([...fromMappings, ...localTeams]);
    return Array.from(merged).sort();
  }, [mappings, localTeams]);

  const uniqueTeams = new Set(mappings.map((m) => m.team || "Unassigned"));
  const unassignedCount = mappings.filter((m) => !m.team || m.team === "Unassigned").length;

  /* ─── Team CRUD ─── */
  const addTeam = () => {
    const name = newTeamInput.trim();
    if (!name || allTeams.includes(name)) return;
    setLocalTeams((prev) => [...prev, name]);
    setNewTeamInput("");
  };

  const removeTeam = (teamName: string) => {
    const pagesInTeam = mappings.filter((m) => m.team === teamName);
    if (pagesInTeam.length > 0) {
      if (!confirm(`"${teamName}" has ${pagesInTeam.length} page(s). Unassign all and remove this team?`)) return;
      // Unassign all pages in this team
      pagesInTeam.forEach((p) => mutation.mutate({ id: p.id, team: null }));
    }
    setLocalTeams((prev) => prev.filter((t) => t !== teamName));
  };

  /* ─── Page team assignment ─── */
  const assignTeam = (mappingId: number, team: string | null) => {
    mutation.mutate({ id: mappingId, team });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/revenue"
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Revenue Page Mappings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage teams and assign Facebook pages for revenue grouping
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pages</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{mappings.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teams</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{allTeams.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unassigned</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{unassignedCount}</p>
        </div>
      </div>

      {/* ═══ Team Management Section ═══ */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Manage Teams</h2>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Add or remove team labels
          </span>
        </div>

        <div className="p-4">
          {/* Add team input */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={newTeamInput}
                onChange={(e) => setNewTeamInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTeam(); }
                }}
                placeholder="New team name..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={addTeam}
              disabled={!newTeamInput.trim() || allTeams.includes(newTeamInput.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {/* Team pills */}
          {allTeams.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">
              No teams yet. Add a team above or assign one to a page below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTeams.map((team) => {
                const count = mappings.filter((m) => m.team === team).length;
                return (
                  <div
                    key={team}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 pl-3 pr-1.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400 transition-colors hover:border-indigo-300 dark:hover:border-indigo-700"
                  >
                    <span>{team}</span>
                    <span className="text-[10px] text-indigo-400 dark:text-indigo-500">
                      ({count})
                    </span>
                    <button
                      onClick={() => removeTeam(team)}
                      className="ml-0.5 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-700 dark:hover:bg-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      title={`Remove "${team}"`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Page Assignments Table ═══ */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Users size={15} className="text-gray-400" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Page Assignments</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Page Name
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Page ID
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">
                  Team
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      Loading mappings...
                    </div>
                  </td>
                </tr>
              ) : mappings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                    No page mappings found. Revenue data will appear once pages are synced.
                  </td>
                </tr>
              ) : (
                mappings.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 dark:border-gray-800/50 dark:hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                      {row.pageName}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400 dark:text-gray-500 hidden sm:table-cell">
                      {row.pageId}
                    </td>
                    <td className="px-4 py-2.5">
                      <TeamDropdown
                        currentTeam={row.team}
                        teams={allTeams}
                        isPending={mutation.isPending}
                        onSelect={(team) => assignTeam(row.id, team)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Team Dropdown Sub-component ─── */
function TeamDropdown({
  currentTeam,
  teams,
  isPending,
  onSelect,
}: {
  currentTeam: string | null;
  teams: string[];
  isPending: boolean;
  onSelect: (team: string | null) => void;
}) {
  const isAssigned = !!currentTeam && currentTeam !== "Unassigned";

  return (
    <div className="relative">
      <select
        value={currentTeam || ""}
        onChange={(e) => {
          const val = e.target.value;
          onSelect(val === "" ? null : val);
        }}
        disabled={isPending}
        className={`w-full max-w-[220px] appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-medium transition-colors cursor-pointer outline-none disabled:opacity-50
          ${isAssigned
            ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:border-indigo-700"
            : "border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500"
          }`}
      >
        <option value="">Unassigned</option>
        {teams.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}
