"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";
import {
  Facebook,
  Instagram,
  CheckCircle2,
  AlertCircle,
  X,
  CheckSquare,
  Square,
  Search,
  Loader2,
  Clock,
  RefreshCw,
  LogOut,
} from "lucide-react";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SettingsPage() {
  const router = useRouter();

  const [connected, setConnected] = useState({ meta: false, instagram: true });
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [syncStatus, setSyncStatus] = useState<{
    isSyncing: boolean;
    etaMinutes: number;
    pageCount: number;
  } | null>(null);

  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [deleteDataOnDisconnect, setDeleteDataOnDisconnect] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });
        setIsSdkLoaded(true);
      };

      (function (d, s, id) {
        let js: any,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs?.parentNode?.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    }
  }, []);

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/profiles/list`, {
          credentials: "include",
        });
        if (res.ok) {
          const profiles = await res.json();
          if (Array.isArray(profiles)) {
            setActiveProfiles(profiles);
            const hasMeta = profiles.some(
              (p: any) => p.platform === "facebook",
            );
            setConnected((prev) => ({ ...prev, meta: hasMeta }));
          }
        }
      } catch (err) {}
    };
    checkConnectionStatus();
  }, []);

  const handleConnect = () => {
    if (!isSdkLoaded) return;
    setIsLoading(true);

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { accessToken: shortLivedToken } = response.authResponse;

          fetch(`${BACKEND_URL}/api/auth/meta/fetch-pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ shortLivedToken }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.pages) {
                setAvailablePages(data.pages);
                setSelectedPages(data.pages);
                setShowModal(true);
              }
              setIsLoading(false);
            })
            .catch((err) => {
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      },
      {
        scope:
          "public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement,pages_manage_metadata,read_insights,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,business_management",
      },
    );
  };

  const handleConfirmSelection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/auth/meta/confirm-pages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ selectedPages }),
        },
      );

      if (response.ok) {
        const totalEstimatedSeconds = selectedPages.length * 3 * 6;
        const etaMinutes = Math.max(1, Math.ceil(totalEstimatedSeconds / 60));

        setSyncStatus({
          isSyncing: true,
          etaMinutes,
          pageCount: selectedPages.length,
        });
        setAvailablePages([]);
        setSelectedPages([]);
        setShowModal(false);
        setConnected({ ...connected, meta: true });

        const res = await fetch(`${BACKEND_URL}/api/analytics/profiles/list`, {
          credentials: "include",
        });
        if (res.ok) setActiveProfiles(await res.json());
      }
    } catch (error) {}
    setIsLoading(false);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      for (const profile of activeProfiles) {
        await fetch(
          `${BACKEND_URL}/api/analytics/profiles/${profile.profileId}/sync`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({}), 
          },
        );
      }
      const etaMinutes = Math.max(
        1,
        Math.ceil((activeProfiles.length * 3 * 2) / 60),
      );
      setSyncStatus({
        isSyncing: true,
        etaMinutes,
        pageCount: activeProfiles.length,
      });
    } catch (e) {}
    setIsManualSyncing(false);
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/meta/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deleteData: deleteDataOnDisconnect }),
      });

      if (response.ok) {
        setConnected({ ...connected, meta: false });
        setActiveProfiles([]);
        setShowDisconnectModal(false);
        setDeleteDataOnDisconnect(false);
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
    setIsDisconnecting(false);
  };

  const handleAppLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const toggleSelection = (page: any) => {
    setSelectedPages((prev) => {
      const exists = prev.find((p) => p.id === page.id);
      return exists ? prev.filter((p) => p.id !== page.id) : [...prev, page];
    });
  };

  const handleSelectAll = () => {
    if (selectedPages.length === availablePages.length) setSelectedPages([]);
    else setSelectedPages([...availablePages]);
  };

  const filteredPages = availablePages.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const errorProfiles = activeProfiles.filter(
    (p) => p.syncState === "FAILED" && p.lastSyncError,
  );

 return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your connected social accounts and workspace preferences.</p>
      </div>

      {syncStatus?.isSyncing && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="mt-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 p-2 text-blue-600 dark:text-blue-400">
            <Clock size={20} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Data Sync in Progress</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              We are currently downloading historical data for {syncStatus.pageCount} page(s). 
              This happens in the background to respect platform rate limits.
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 mt-3">
              Estimated wait time: ~{syncStatus.etaMinutes} Minute(s)
            </p>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
            <X size={18} />
          </button>
        </div>
      )}

      {errorProfiles.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900 dark:text-red-300">Action Required: Facebook API Issues</h3>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1 mb-3">
                Facebook blocked us from fetching data for the following pages. This usually happens if Two-Factor Authentication (2FA) is required by the Page's Business Manager, or if you lack sufficient Admin permissions.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {errorProfiles.map(profile => (
                  <div key={profile.profileId} className="bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-900/30 p-2.5 shadow-sm">
                    <span className="font-bold text-gray-900 dark:text-white text-xs block mb-0.5">{profile.name}</span>
                    <span className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded break-words">
                      {profile.lastSyncError}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Connected Accounts</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800/50">

            <div className={`p-6 transition-colors ${connected.meta ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-md shrink-0">
                    <Facebook size={24} fill="currentColor" className="text-white" />
                  </div>
                  <div className="w-full max-w-lg">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Facebook Pages & Groups</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Publish posts, track engagement, and manage messages.</p>
                    
                    {connected.meta ? (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-500">
                        <CheckCircle2 size={14} /> Tracking {activeProfiles.filter(p => p.platform === 'facebook').length} Page(s)
                      </span>
                    ) : (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">
                        <AlertCircle size={14} /> Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {!connected.meta ? (
                  <button 
                    onClick={handleConnect}
                    disabled={!isSdkLoaded || isLoading}
                    className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-[#1877F2] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#166fe5] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Facebook size={18} fill="currentColor" />}
                    <span>{isLoading ? "Loading..." : "Connect to Meta"}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleManualSync}
                      disabled={isManualSyncing || syncStatus?.isSyncing}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isManualSyncing || syncStatus?.isSyncing ? "animate-spin text-blue-600" : ""} />
                      {isManualSyncing || syncStatus?.isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                    <button 
                      onClick={() => setShowDisconnectModal(true)}
                      className="rounded-xl border border-red-200 dark:border-red-900/30 bg-white dark:bg-gray-800 px-5 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm transition-colors flex items-center gap-2"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white shadow-sm">
                    <Instagram size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Instagram Professional</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Requires a connected Facebook Page.</p>
                  </div>
                </div>
                <button className="rounded-full bg-gray-900 dark:bg-white px-5 py-2 text-sm font-bold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                  Connect
                </button>
              </div>
            </div> */}

          </div>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Session Management</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sign Out</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Securely log out of your Social Studio Analytics workspace.</p>
            </div>
            <button 
              onClick={handleAppLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-50"
            >
              {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      {showDisconnectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">Disconnect Meta Accounts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Are you sure you want to disconnect? Your automated data syncing will stop immediately.
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-900 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={deleteDataOnDisconnect}
                    onChange={(e) => setDeleteDataOnDisconnect(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-600 dark:bg-gray-800 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">Delete all historical data</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1 leading-relaxed">
                    Checking this will permanently remove all downloaded posts and analytics from your database. Leave unchecked to save time if you plan to reconnect later.
                  </span>
                </div>
              </label>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={() => {
                  setShowDisconnectModal(false);
                  setDeleteDataOnDisconnect(false);
                }} 
                disabled={isDisconnecting}
                className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDisconnect} 
                disabled={isDisconnecting} 
                className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isDisconnecting ? <Loader2 size={16} className="animate-spin" /> : "Disconnect Accounts"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Import Meta Pages</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select the pages you want to track in your workspace.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                <Search size={16} className="text-gray-400 dark:text-gray-500" />
                <input 
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages..." className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
                />
              </div>
              <button onClick={handleSelectAll} className="flex items-center gap-2 w-full px-2 py-1 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {selectedPages.length === availablePages.length ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400"/> : <Square size={16} />}
                {selectedPages.length === availablePages.length ? "Deselect All Pages" : "Select All Pages"}
              </button>
            </div>

            <div className="overflow-y-auto p-3 space-y-1 flex-1 custom-scrollbar bg-gray-50/30 dark:bg-gray-900">
              {filteredPages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No pages found.</div>
              ) : (
                filteredPages.map(page => {
                  const isSelected = selectedPages.some(p => p.id === page.id);
                  return (
                    <button key={page.id} onClick={() => toggleSelection(page)} className={`flex items-center gap-4 w-full text-left px-4 py-3 text-sm transition-all rounded-xl border ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-gray-900 dark:text-white shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                      {isSelected ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0"/> : <Square size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0"/>}
                      <span className={`truncate flex-1 ${isSelected ? 'font-bold' : 'font-medium'}`}>{page.name}</span>
                    </button>
                  );
                })
              )}
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{selectedPages.length} selected</span>
              <button onClick={handleConfirmSelection} disabled={selectedPages.length === 0 || isLoading} className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#166fe5] transition-all disabled:opacity-50">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Import Selected"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Links */}
      <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-6 text-sm">
        <a href="/privacy" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Privacy Policy
        </a>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <a href="/terms" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Terms of Service
        </a>
      </div>
    </div>
  );
}
