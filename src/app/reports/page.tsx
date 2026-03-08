"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  CheckSquare,
  Square,
  CheckCircle2,
  Circle,
  Facebook,
  Instagram,
  AlertTriangle,
} from "lucide-react";
import { Profile } from "./types";
import OverviewTab from "./components/OverviewTab";
import ProfilesTab from "./components/ProfilesTab";
import PostInsightsTab from "./components/PostInsightsTab";
import CompareTab from "./components/CompareTab";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"page" | "post">("page");
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "profiles" | "compare"
  >("overview");
  const [activePlatform, setActivePlatform] = useState<
    "facebook" | "instagram"
  >("facebook");

  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${BACKEND_URL}/api/analytics/profiles/list`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profiles");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProfiles(data);
          const fbProfiles = data.filter((p) => p.platform === "facebook");
          setSelectedProfileIds(fbProfiles.map((p) => p.profileId));
          if (fbProfiles.length > 0)
            setSelectedProfileId(fbProfiles[0].profileId);
        } else {
          setProfiles([]);
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setProfiles([]);
      });
  }, []);

  const handlePlatformSwitch = (platform: "facebook" | "instagram") => {
    setActivePlatform(platform);
    const platformProfiles = profiles.filter((p) => p.platform === platform);
    setSelectedProfileIds(platformProfiles.map((p) => p.profileId));
    if (platformProfiles.length > 0) {
      setSelectedProfileId(platformProfiles[0].profileId);
    } else {
      setSelectedProfileId(null);
    }
    setIsDropdownOpen(false);
  };

  const currentPlatformProfiles = profiles.filter(
    (p) => p.platform === activePlatform,
  );
  const isMultiSelectView =
    activeSubTab === "overview" || activeSubTab === "compare";
  const isAllSelected =
    currentPlatformProfiles.length > 0 &&
    currentPlatformProfiles.every((p) =>
      selectedProfileIds.includes(p.profileId),
    );

  const toggleSelectAll = () => {
    if (isAllSelected)
      setSelectedProfileIds(
        selectedProfileIds.filter(
          (id) => !currentPlatformProfiles.map((p) => p.profileId).includes(id),
        ),
      );
    else
      setSelectedProfileIds(
        Array.from(
          new Set([
            ...selectedProfileIds,
            ...currentPlatformProfiles.map((p) => p.profileId),
          ]),
        ),
      );
  };

  const toggleMultiProfile = (id: string) => {
    if (selectedProfileIds.includes(id))
      setSelectedProfileIds(selectedProfileIds.filter((pid) => pid !== id));
    else setSelectedProfileIds([...selectedProfileIds, id]);
  };

  const selectSingleProfile = (id: string) => {
    setSelectedProfileId(id);
    setIsDropdownOpen(false);
  };

  const errorProfiles = profiles.filter(
    (p) =>
      (isMultiSelectView
        ? selectedProfileIds.includes(p.profileId)
        : p.profileId === selectedProfileId) &&
      p.syncState === "FAILED" &&
      p.lastSyncError,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Analyze your cross-channel social media performance
          </p>
        </div>
        <div className="flex items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setActiveTab("page")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeTab === "page" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            Page Insights
          </button>
          <button
            onClick={() => setActiveTab("post")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeTab === "post" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            Post Insights
          </button>
        </div>
      </div>

      {activeTab === "page" && (
        <>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handlePlatformSwitch("facebook")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activePlatform === "facebook" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  <Facebook size={16} /> Facebook
                </button>
                <button
                  onClick={() => handlePlatformSwitch("instagram")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activePlatform === "instagram" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  <Instagram size={16} /> Instagram
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-64 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                >
                  <span className="truncate pr-2">
                    {isMultiSelectView
                      ? selectedProfileIds.length === 0
                        ? "Select Pages..."
                        : selectedProfileIds.length ===
                            currentPlatformProfiles.length
                          ? `All ${activePlatform} Pages`
                          : `${selectedProfileIds.length} Pages Selected`
                      : currentPlatformProfiles.find(
                          (p) => p.profileId === selectedProfileId,
                        )?.name || "Select Page..."}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-gray-500 dark:text-gray-400 flex-shrink-0"
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden">
                    {isMultiSelectView && (
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center gap-3 w-full px-2 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {isAllSelected ? (
                            <CheckSquare
                              size={18}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          ) : (
                            <Square
                              size={18}
                              className="text-gray-400 dark:text-gray-500"
                            />
                          )}
                          Select All
                        </button>
                      </div>
                    )}
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {currentPlatformProfiles.map((profile) => {
                        const isSelectedMulti = selectedProfileIds.includes(
                          profile.profileId,
                        );
                        const isSelectedSingle =
                          selectedProfileId === profile.profileId;
                        return (
                          <button
                            key={profile.profileId}
                            onClick={() =>
                              isMultiSelectView
                                ? toggleMultiProfile(profile.profileId)
                                : selectSingleProfile(profile.profileId)
                            }
                            className={`flex items-center gap-3 w-full text-left px-2 py-2 text-sm transition-colors rounded-md ${(isMultiSelectView ? isSelectedMulti : isSelectedSingle) ? "bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-white font-bold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"}`}
                          >
                            {isMultiSelectView ? (
                              isSelectedMulti ? (
                                <CheckSquare
                                  size={18}
                                  className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                                />
                              ) : (
                                <Square
                                  size={18}
                                  className="text-gray-300 dark:text-gray-600 flex-shrink-0"
                                />
                              )
                            ) : isSelectedSingle ? (
                              <CheckCircle2
                                size={18}
                                className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                              />
                            ) : (
                              <Circle
                                size={18}
                                className="text-gray-300 dark:text-gray-600 flex-shrink-0"
                              />
                            )}
                            <span className="truncate">{profile.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {errorProfiles.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-400">
                    Connection Error Detected
                  </h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
                    {errorProfiles.map((p) => (
                      <li key={p.profileId}>
                        <strong>{p.name}:</strong> {p.lastSyncError}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubTab("overview")}
                className={`pb-3 px-6 text-sm font-bold tracking-wide uppercase transition-colors shrink-0 ${activeSubTab === "overview" ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveSubTab("compare")}
                className={`pb-3 px-6 text-sm font-bold tracking-wide uppercase transition-colors shrink-0 ${activeSubTab === "compare" ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                Compare
              </button>
              <button
                onClick={() => setActiveSubTab("profiles")}
                className={`pb-3 px-6 text-sm font-bold tracking-wide uppercase transition-colors shrink-0 ${activeSubTab === "profiles" ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                Profiles
              </button>
            </div>

            {activeSubTab === "overview" ? (
              <OverviewTab
                selectedProfileIds={selectedProfileIds}
                activePlatform={activePlatform}
              />
            ) : activeSubTab === "compare" ? (
              <CompareTab
                selectedProfileIds={selectedProfileIds}
                activePlatform={activePlatform}
              />
            ) : (
              <ProfilesTab
                profile={
                  profiles.find((p) => p.profileId === selectedProfileId) ||
                  null
                }
              />
            )}
          </div>
        </>
      )}
      {activeTab === "post" && (
        <PostInsightsTab
          selectedProfileIds={selectedProfileIds}
          profiles={profiles}
        />
      )}
    </div>
  );
}
