"use client";

import React, { useState, useEffect } from "react";
import { Database, RefreshCw } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function DebugPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch profiles on load
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/analytics/profiles/list`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filtering explicitly for Instagram to avoid affecting/cluttering with FB pages
          const igProfiles = data.filter((p: any) => p.platform === "instagram");
          setProfiles(igProfiles);
          if (igProfiles.length > 0) {
            setSelectedId(igProfiles[0].profileId);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch profiles", err));
  }, []);

  const fetchDebugData = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/analytics/debug/${selectedId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setDebugData(data);
    } catch (err) {
      console.error(err);
      setDebugData({ error: "Failed to fetch debug data." });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Database className="text-indigo-500 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Instagram DB Inspector
          </h1>
          <p className="text-sm text-gray-500">
            Raw JSON view of the PostgreSQL tables for your Instagram profiles.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-72 p-2.5 outline-none font-semibold"
        >
          {profiles.length === 0 && <option value="">No Instagram profiles found</option>}
          {profiles.map((p) => (
            <option key={p.profileId} value={p.profileId}>
              {p.name} ({p.profileId})
            </option>
          ))}
        </select>

        <button
          onClick={fetchDebugData}
          disabled={loading || !selectedId}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Database className="w-4 h-4" />}
          {loading ? "Fetching DB..." : "Fetch DB Data"}
        </button>
      </div>

      {debugData && (
        <div className="bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-black/50">
            <span className="text-gray-300 text-xs font-mono font-bold tracking-wider uppercase">
              JSON Payload (PostgreSQL)
            </span>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          <div className="p-4 max-h-[70vh] overflow-auto custom-scrollbar">
            <pre className="text-green-400 font-mono text-[13px] leading-relaxed">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}