"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  MousePointer2,
  Users,
  Eye,
  Activity,
  RefreshCcw,
  Calendar,
  ChevronRight,
  X,
  Database,
  UserCheck,
  Facebook,
  Layers,
  Settings,
  ArrowLeft,
  Trash2,
  Plus,
  UploadCloud,
  Loader2,
  LayoutList,
  Briefcase
} from "lucide-react";

import { StatCard } from "@/components/ui/StatCard";
import { Headlines } from "@/components/ui/Headlines";
import { cn } from "@/lib/utils";
import { CountryStats } from "@/components/ui/CountryStats";
import { TrafficChart } from "@/features/traffic/components/TrafficChart";
import { TrafficTable } from "@/features/traffic/components/TrafficTable";

import { useTrafficData } from "@/features/traffic/hooks/useTrafficData";
import {
  fetchPageMappings,
  createPageMapping,
  deletePageMapping,
  updatePageMapping,
  importPageMappingsCSV,
  importLegacyDataCSV,
} from "@/lib/api";
import { MappingEntry } from "@/data/page-mapping";

interface MappingWithId extends MappingEntry {
  id?: number;
}

// =====================================================================
// 1. MAPPINGS & TEAMS DIRECTORY COMPONENT
// =====================================================================
export function MappingsView({ onBack }: { onBack: () => void }) {
  const [mappings, setMappings] = useState<MappingWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"mappings" | "teams">("mappings");

  // New Mapping State
  const [newCategory, setNewCategory] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [newPlatform, setNewPlatform] = useState("Facebook");
  const [newPageName, setNewPageName] = useState("");
  const [newUtmSource, setNewUtmSource] = useState("fb");
  const [newMediums, setNewMediums] = useState("");

  // Upload States
  const [isUploadingMapping, setIsUploadingMapping] = useState(false);
  const [isUploadingAnalytics, setIsUploadingAnalytics] = useState(false);
  const mappingFileInputRef = useRef<HTMLInputElement>(null);
  const analyticsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const data = await fetchPageMappings();
      setMappings(data);
    } catch (error) {
      console.error("Failed to load mappings", error);
    }
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
      team: newTeam.trim() || undefined,
      platform: newPlatform,
      pageName: newPageName,
      utmSource: newUtmSource,
      utmMediums: mediumsArray,
    };

    try {
      await createPageMapping(newEntry);
      setNewPageName("");
      setNewMediums("");
      setNewTeam("");
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

  const handleUpdateTeam = async (
    id: number | undefined,
    currentTeam: string | undefined,
  ) => {
    if (!id) return;
    const updatedTeam = prompt("Enter new team name:", currentTeam || "");
    if (updatedTeam !== null) {
      try {
        await updatePageMapping(id, { team: updatedTeam.trim() || undefined });
        loadMappings();
      } catch (err) {
        console.error("Failed to update team", err);
        alert("Failed to update team");
      }
    }
  };

  const handleAssignTeam = async (id: number, teamName: string) => {
    try {
      await updatePageMapping(id, { team: teamName });
      loadMappings();
    } catch (err) {
      console.error("Failed to assign team", err);
      alert("Failed to assign team");
    }
  };

  const handleRemoveFromTeam = async (id: number) => {
    if (confirm("Remove this page from the team?")) {
      try {
        await updatePageMapping(id, { team: "" });
        loadMappings();
      } catch (err) {
        console.error("Failed to remove from team", err);
        alert("Failed to remove from team");
      }
    }
  };

  const handleMappingFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMapping(true);
    try {
      const res = await importPageMappingsCSV(file);
      alert(res.message || "Page mappings imported successfully!");
      loadMappings();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to import mappings");
    } finally {
      setIsUploadingMapping(false);
      if (mappingFileInputRef.current) mappingFileInputRef.current.value = "";
    }
  };

  const handleAnalyticsFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      if (analyticsFileInputRef.current)
        analyticsFileInputRef.current.value = "";
    }
  };

  const groupedByTeam = useMemo(() => {
    const grouped: Record<string, MappingWithId[]> = {};
    mappings.forEach((m) => {
      const teamName = m.team?.trim() || "Unassigned";
      if (!grouped[teamName]) grouped[teamName] = [];
      grouped[teamName].push(m);
    });
    return grouped;
  }, [mappings]);

  const activeTeams = Object.keys(groupedByTeam)
    .filter((t) => t !== "Unassigned")
    .sort();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings & Mappings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure UTM tracking maps and team assignments.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-fit">
          <button
            onClick={() => setViewMode("mappings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === "mappings"
              ? "bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <LayoutList className="w-4 h-4" /> Directory
          </button>
          <button
            onClick={() => setViewMode("teams")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === "teams"
              ? "bg-white dark:bg-gray-900 shadow-sm text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <Users className="w-4 h-4" /> Teams
          </button>
        </div>
      </div>

      {viewMode === "mappings" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-gray-900 dark:text-white">
                <UploadCloud className="w-5 h-5 text-blue-500" /> Upload Page
                Mappings
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1">
                Import a CSV to bulk-add page mapping configurations.
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
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
              >
                {isUploadingMapping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                {isUploadingMapping ? "Uploading..." : "Select Mappings CSV"}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-gray-900 dark:text-white">
                <UploadCloud className="w-5 h-5 text-green-500" /> Upload Legacy
                Analytics
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1">
                Import raw daily UTM analytics data via CSV to append historical
                traffic figures.
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
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
              >
                {isUploadingAnalytics ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                {isUploadingAnalytics
                  ? "Processing..."
                  : "Select Legacy Data CSV"}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Add Single Mapping
            </h2>
            <form
              onSubmit={handleAdd}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Category
                </label>
                <input
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. USS"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Team
                </label>
                <input
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="e.g. Design Team"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Platform
                </label>
                <select
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Threads">Threads</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Page Name
                </label>
                <input
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="Display Name"
                />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  UTM Mediums (comma separated)
                </label>
                <input
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={newMediums}
                  onChange={(e) => setNewMediums(e.target.value)}
                  placeholder="uss_page_1, uss_page_2"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-6 flex justify-end mt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Mapping
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Team</th>
                    <th className="px-6 py-3">Platform</th>
                    <th className="px-6 py-3">Page Name</th>
                    <th className="px-6 py-3">UTM Mediums</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-500" />
                        Loading mappings...
                      </td>
                    </tr>
                  ) : mappings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No mappings found. Add one above or upload a CSV.
                      </td>
                    </tr>
                  ) : (
                    mappings.map((m) => (
                      <tr
                        key={m.id || m.pageName}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200 transition-colors"
                      >
                        <td className="px-6 py-3 font-bold">{m.category}</td>
                        <td className="px-6 py-3">
                          {m.team ? (
                            <span className="font-semibold text-violet-600 dark:text-violet-400">
                              {m.team}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">{m.platform}</td>
                        <td className="px-6 py-3 font-bold text-blue-600 dark:text-blue-400">
                          {m.pageName}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {m.utmMediums.map((med) => (
                              <span
                                key={med}
                                className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-[11px] font-medium border border-gray-200 dark:border-gray-700"
                              >
                                {med}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateTeam(m.id, m.team)}
                            className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
                            title="Edit Team"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Active Teams
              </h2>
              {activeTeams.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-500 border border-gray-200 dark:border-gray-800 border-dashed rounded-xl">
                  No teams created yet. Assign an unassigned page to a team to create one.
                </div>
              )}
              {activeTeams.map((teamName) => (
                <div
                  key={teamName}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {teamName}
                    </h3>
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs px-2.5 py-1 rounded-full font-bold">
                      {groupedByTeam[teamName].length} Pages
                    </span>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {groupedByTeam[teamName].map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm"
                      >
                        <span className="text-gray-800 dark:text-gray-200">
                          {page.pageName}
                        </span>
                        <button
                          onClick={() => handleRemoveFromTeam(page.id!)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Remove from Team"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <div className="relative group">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignTeam(Number(e.target.value), teamName);
                            e.target.value = "";
                          }
                        }}
                        className="appearance-none bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg pl-3 pr-8 py-1.5 outline-none hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-colors"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Add Page</option>
                        {groupedByTeam["Unassigned"]?.map((uPage) => (
                          <option key={uPage.id} value={uPage.id}>
                            {uPage.pageName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" /> Unassigned Pages
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                {(!groupedByTeam["Unassigned"] || groupedByTeam["Unassigned"].length === 0) ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    All pages are currently assigned to teams!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {groupedByTeam["Unassigned"].map((page) => (
                      <div
                        key={page.id}
                        className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg"
                      >
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                          {page.pageName}
                        </span>
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value === "NEW_TEAM") {
                                handleUpdateTeam(page.id, undefined);
                              } else if (e.target.value) {
                                handleAssignTeam(page.id!, e.target.value);
                              }
                              e.target.value = "";
                            }}
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md p-1.5 outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Assign to...</option>
                            {activeTeams.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                            <option value="NEW_TEAM" className="font-bold text-indigo-600">
                              + Create New Team
                            </option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 2. MAIN DASHBOARD COMPONENT (Traffic Overview + Table)
// =====================================================================
export default function WebTrafficPage() {
  const [mounted, setMounted] = useState(false);
  const [showMappings, setShowMappings] = useState(false);

  const trafficData = useTrafficData();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[50vh] flex-col gap-3 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <RefreshCcw className="w-6 h-6 text-indigo-600 animate-spin" />
        <div className="text-gray-500 dark:text-gray-400 font-medium">
          Loading Web Traffic Analytics...
        </div>
      </div>
    );
  }

  if (showMappings) {
    return <MappingsView onBack={() => setShowMappings(false)} />;
  }

  const {
    data,
    rawData,
    countryStats,
    headlines,
    loading,
    filters,
    options,
    stats,
    refresh,
    sync,
  } = trafficData;

  return (
    <div className="space-y-6 pb-4 animate-in fade-in duration-300">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Web Traffic Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time cross-channel traffic and engagement metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1 shrink-0">
            <button
              onClick={() => filters.setPlatform("Facebook")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${filters.platform === "Facebook"
                ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <Facebook size={16} /> <span className="hidden sm:inline">Facebook</span>
            </button>
            <button
              onClick={() => filters.setPlatform("Threads")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${filters.platform === "Threads"
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <Layers size={16} /> <span className="hidden sm:inline">Threads</span>
            </button>
          </div>

          <button
            onClick={() => setShowMappings(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-full text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Mappings</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex flex-row flex-wrap items-center gap-3 w-full xl:w-auto">

          <div className="flex flex-col sm:flex-row items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => filters.setStartDate(e.target.value)}
                className="bg-transparent w-full sm:w-[130px] text-sm pl-9 pr-2 py-1.5 sm:py-1 outline-none text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
              />
            </div>
            <ChevronRight className="hidden sm:block w-4 h-4 text-gray-400 mx-0.5" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => filters.setEndDate(e.target.value)}
              className="bg-transparent w-full sm:w-[130px] text-sm px-3 sm:px-2 py-1.5 sm:py-1 outline-none text-gray-700 dark:text-gray-200 font-medium cursor-pointer border-t sm:border-t-0 border-gray-200 dark:border-gray-700 mt-1 sm:mt-0"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {[
              { label: "7 Days", key: "last7Days" },
              { label: "This Month", key: "thisMonth" },
              { label: "2 Weeks", key: "prevWeek" },
              { label: "30 Days", key: "30days" },
            ].map((preset) => (
              <button
                key={preset.key}
                onClick={() => filters.applyPreset(preset.key as any)}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <select
              value={filters.selectedCampaign}
              onChange={(e) => filters.setSelectedCampaign(e.target.value)}
              className="flex-1 sm:flex-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 sm:p-1.5 px-3 min-w-[160px]"
            >
              <option value="">All Campaigns</option>
              {options.availableCampaigns.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {(filters.selectedCampaign || filters.startDate) && (
              <button
                onClick={filters.resetFilters}
                className="flex items-center justify-center p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors shrink-0"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-gray-100 dark:border-gray-800">
          <button
            onClick={sync.handleSync}
            disabled={sync.isSyncing}
            className="flex-1 xl:flex-none justify-center flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 font-bold rounded-lg text-sm px-4 py-2 transition-all shadow-sm disabled:opacity-50"
          >
            <Database className={cn("w-4 h-4", sync.isSyncing && "animate-pulse")} />
            <span className="whitespace-nowrap">{sync.isSyncing ? "Syncing..." : "Sync BQ"}</span>
          </button>
          <button
            onClick={() => refresh()}
            className="flex-1 xl:flex-none justify-center flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black font-bold rounded-lg text-sm px-5 py-2 transition-all shadow-sm active:scale-95"
          >
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span className="whitespace-nowrap">Refresh</span>
          </button>
        </div>
      </div>

      <div className="relative space-y-6">
        {loading && (
          <div className="absolute inset-0 z-50 bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg flex items-center gap-3 border border-gray-100 dark:border-gray-800">
              <RefreshCcw className="w-5 h-5 text-indigo-600 animate-spin" />
              <span className="font-bold text-gray-900 dark:text-white">Refreshing Data...</span>
            </div>
          </div>
        )}

        <Headlines data={headlines} loading={loading} rawData={rawData} mappedSessions={stats.sessions} />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <StatCard title="Sessions" value={stats.sessions.toLocaleString()} icon={MousePointer2} colorClass="bg-blue-500" loading={loading} />
          <StatCard title="Users" value={stats.users.toLocaleString()} icon={Users} colorClass="bg-indigo-500" loading={loading} />
          <StatCard title="Pageviews" value={stats.pageviews.toLocaleString()} icon={Eye} colorClass="bg-emerald-500" loading={loading} />
          <StatCard title="Engagement" value={((stats.engagement / (data.length || 1)) * 100).toFixed(2) + "%"} icon={Activity} colorClass="bg-amber-500" loading={loading} />
          <StatCard title="Recurring" value={stats.recurring_users?.toLocaleString() || "0"} icon={UserCheck} colorClass="bg-purple-500" loading={loading} />
        </div>

        <div className="flex flex-col lg:flex-row xl:grid xl:grid-cols-3 gap-6 items-stretch">
          <div className="w-full lg:w-2/3 xl:w-auto xl:col-span-2 min-h-[300px]">
            <TrafficChart data={data} dateHeaders={options.dateHeaders} stats={stats} />
          </div>
          <div className="w-full lg:w-1/3 xl:w-auto xl:col-span-1 min-h-[300px]">
            <CountryStats countryStats={countryStats || []} />
          </div>
        </div>

        <div className="w-full pb-4">
          <TrafficTable
            data={data}
            dateHeaders={options.dateHeaders}
            onOpenMappings={() => setShowMappings(true)}
          />
        </div>
      </div>
    </div>
  );
}