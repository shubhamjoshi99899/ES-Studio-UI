"use client";

import { useState, useEffect, useRef } from "react";
import {
  fetchPageMappings,
  createPageMapping,
  deletePageMapping,
  updatePageMapping,
  importPageMappingsCSV,
  importLegacyDataCSV,
} from "@/lib/api";
import { MappingEntry } from "@/data/page-mapping";
import { Trash2, Plus, ArrowLeft, UploadCloud, Loader2, X, Users } from "lucide-react";
import Link from "next/link";

interface MappingWithId extends MappingEntry {
  id?: number;
}

export default function PageMappingsSettings() {
  const [mappings, setMappings] = useState<MappingWithId[]>([]);
  const [loading, setLoading] = useState(true);

  // Single Entry States
  const [newCategory, setNewCategory] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [newPlatform, setNewPlatform] = useState("Facebook");
  const [newPageName, setNewPageName] = useState("");
  const [newUtmSource, setNewUtmSource] = useState("fb");
  const [newMediums, setNewMediums] = useState("");

  // Team Management
  const [newTeamName, setNewTeamName] = useState("");
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamAssignPages, setNewTeamAssignPages] = useState<number[]>([]);

  // Upload States
  const [isUploadingMapping, setIsUploadingMapping] = useState(false);
  const [isUploadingAnalytics, setIsUploadingAnalytics] = useState(false);
  const mappingFileInputRef = useRef<HTMLInputElement>(null);
  const analyticsFileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique teams from mappings
  const existingTeams = Array.from(
    new Set(mappings.map((m) => m.team).filter(Boolean) as string[])
  ).sort();

  // Pages not assigned to any team — deduped by pageName so each page
  // appears once (matching the aggregated traffic table). Keeps all
  // underlying mapping IDs so assignment applies to every row.
  const unassignedPages = (() => {
    const byName = new Map<string, { pageName: string; ids: number[]; sample: MappingWithId }>();
    mappings.forEach((m) => {
      if (m.team) return;
      const entry = byName.get(m.pageName);
      if (entry) {
        if (m.id != null) entry.ids.push(m.id);
      } else {
        byName.set(m.pageName, {
          pageName: m.pageName,
          ids: m.id != null ? [m.id] : [],
          sample: m,
        });
      }
    });
    return Array.from(byName.values()).sort((a, b) => a.pageName.localeCompare(b.pageName));
  })();

  const handleCreateTeamWithPages = async () => {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    if (existingTeams.includes(trimmed)) {
      alert(`Team "${trimmed}" already exists.`);
      return;
    }
    if (newTeamAssignPages.length === 0) {
      alert("Select at least one page to assign to the new team.");
      return;
    }
    setIsAddingTeam(true);
    try {
      for (const pageId of newTeamAssignPages) {
        await updatePageMapping(pageId, { team: trimmed });
      }
      setNewTeamName("");
      setNewTeamAssignPages([]);
      setShowNewTeamForm(false);
      loadMappings();
    } catch (err) {
      console.error("Failed to create team", err);
    } finally {
      setIsAddingTeam(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    const data = await fetchPageMappings();
    setMappings(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName || !newMediums) return;

    const mediumsArray = newMediums
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newEntry: MappingEntry = {
      category: newCategory || "Uncategorized",
      team: newTeam || undefined,
      platform: newPlatform,
      pageName: newPageName,
      utmSource: newUtmSource,
      utmMediums: mediumsArray,
    };

    try {
      await createPageMapping(newEntry);
      setNewPageName("");
      setNewMediums("");
      loadMappings();
    } catch (err) {
      console.error("Failed to add mapping", err);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this mapping?")) {
      await deletePageMapping(id);
      loadMappings();
    }
  };

  const handleTeamChange = async (mappingId: number | undefined, team: string | null) => {
    if (!mappingId) return;
    try {
      await updatePageMapping(mappingId, { team });
      loadMappings();
    } catch (err) {
      console.error("Failed to update team", err);
    }
  };

  const handleRemoveTeam = async (teamName: string) => {
    const pagesWithTeam = mappings.filter((m) => m.team === teamName);
    if (
      !confirm(
        `Remove team "${teamName}"? This will unassign ${pagesWithTeam.length} page(s) from this team.`
      )
    )
      return;

    try {
      for (const m of pagesWithTeam) {
        if (m.id) await updatePageMapping(m.id, { team: null });
      }
      loadMappings();
    } catch (err) {
      console.error("Failed to remove team", err);
    }
  };

  const handleMappingFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMapping(true);
    try {
      const res = await importPageMappingsCSV(file);
      alert(res.message || "Page mappings imported successfully!");
      loadMappings(); // Refresh table after upload
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to import mappings");
    } finally {
      setIsUploadingMapping(false);
      if (mappingFileInputRef.current) mappingFileInputRef.current.value = "";
    }
  };

  const handleAnalyticsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAnalytics(true);
    try {
      const res = await importLegacyDataCSV(file);
      alert(res.message || "Legacy analytics data imported successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to import analytics data");
    } finally {
      setIsUploadingAnalytics(false);
      if (analyticsFileInputRef.current) analyticsFileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-8 text-gray-900 dark:text-gray-100 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/traffic"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">UTM Settings & Mappings</h1>
        </div>

        {/* Bulk Uploads Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-500" /> Upload Page Mappings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Import a CSV to bulk-add page mapping configurations. (category, platform, pageName, utmSource, utmMediums)
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={mappingFileInputRef}
              onChange={handleMappingFileUpload}
            />
            <button
              onClick={() => mappingFileInputRef.current?.click()}
              disabled={isUploadingMapping}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {isUploadingMapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {isUploadingMapping ? "Uploading..." : "Select Mappings CSV"}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-green-500" /> Upload Legacy Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Import raw daily UTM analytics data via CSV to append historical traffic figures to your database.
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={analyticsFileInputRef}
              onChange={handleAnalyticsFileUpload}
            />
            <button
              onClick={() => analyticsFileInputRef.current?.click()}
              disabled={isUploadingAnalytics}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {isUploadingAnalytics ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {isUploadingAnalytics ? "Processing..." : "Select Legacy Data CSV"}
            </button>
          </div>
        </div>

        {/* Team Management */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" /> Team Management
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {existingTeams.length === 0 && !showNewTeamForm && (
              <p className="text-sm text-gray-500">No teams yet. Create one below.</p>
            )}
            {existingTeams.map((team) => {
              const count = mappings.filter((m) => m.team === team).length;
              return (
                <span
                  key={team}
                  className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800"
                >
                  {team}
                  <span className="text-xs opacity-70">({count})</span>
                  <button
                    onClick={() => handleRemoveTeam(team)}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition"
                    title={`Remove team "${team}"`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
          </div>

          {!showNewTeamForm ? (
            <button
              onClick={() => setShowNewTeamForm(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
            >
              <Plus className="w-4 h-4" /> Create Team
            </button>
          ) : (
            <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50/50 dark:bg-purple-900/10 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 max-w-xs p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowNewTeamForm(false);
                      setNewTeamName("");
                      setNewTeamAssignPages([]);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setShowNewTeamForm(false);
                    setNewTeamName("");
                    setNewTeamAssignPages([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {newTeamName.trim() && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select unassigned pages to add to &quot;{newTeamName.trim()}&quot;:
                  </p>
                  {unassignedPages.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      All pages are already assigned to a team. You can reassign pages from the table below.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {unassignedPages.map((page) => {
                        const selected = page.ids.every((id) => newTeamAssignPages.includes(id));
                        return (
                          <button
                            key={page.pageName}
                            onClick={() =>
                              setNewTeamAssignPages((prev) =>
                                selected
                                  ? prev.filter((id) => !page.ids.includes(id))
                                  : [...prev, ...page.ids.filter((id) => !prev.includes(id))]
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                              selected
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-400"
                            }`}
                          >
                            {page.pageName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleCreateTeamWithPages}
                      disabled={isAddingTeam || newTeamAssignPages.length === 0}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm disabled:opacity-50"
                    >
                      {isAddingTeam ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Create &quot;{newTeamName.trim()}&quot; with {newTeamAssignPages.length} page(s)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Add New Single Mapping Form */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Add Single Mapping</h2>
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Category
              </label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. USS"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Platform
              </label>
              <select
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
              >
                <option value="Facebook">Facebook</option>
                <option value="Threads">Threads</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Team
              </label>
              <div className="relative">
                <input
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="Type or select team"
                  list="team-options"
                />
                <datalist id="team-options">
                  {existingTeams.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-bold uppercase text-gray-500">
                Page Name
              </label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder="Display Name"
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-bold uppercase text-gray-500">
                UTM Mediums (comma separated)
              </label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                value={newMediums}
                onChange={(e) => setNewMediums(e.target.value)}
                placeholder="uss_page_1, uss_page_2"
              />
            </div>
            <div className="lg:col-span-7 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" /> Add Mapping
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Page Name</th>
                <th className="px-6 py-4">UTM Mediums</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    Loading mappings...
                  </td>
                </tr>
              ) : mappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No mappings found. Add one above or upload a CSV.
                  </td>
                </tr>
              ) : (
                mappings.map((m) => (
                  <tr
                    key={m.id || m.pageName}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 font-medium">{m.category}</td>
                    <td className="px-6 py-4">
                      <select
                        className="bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm w-full min-w-[100px]"
                        value={m.team || ""}
                        onChange={(e) => {
                          if (e.target.value === "__NEW_TEAM__") {
                            const name = prompt("Enter new team name:");
                            if (name && name.trim()) {
                              handleTeamChange(m.id, name.trim());
                            } else {
                              // Reset to current value if cancelled
                              e.target.value = m.team || "";
                            }
                          } else {
                            handleTeamChange(m.id, e.target.value || null);
                          }
                        }}
                      >
                        <option value="">No Team</option>
                        {existingTeams.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        <option value="__NEW_TEAM__">+ New Team...</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">{m.platform}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                      {m.pageName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {m.utmMediums.map((med) => (
                          <span
                            key={med}
                            title={med}
                            className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700 max-w-[220px] truncate inline-block align-middle"
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition"
                        title="Delete Mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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