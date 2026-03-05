"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CloudDownload, Server } from "lucide-react";

export default function GlobalSyncScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [jobsRemaining, setJobsRemaining] = useState(0);
  const [initialJobs, setInitialJobs] = useState<number | null>(null);

  useEffect(() => {
    const checkSyncStatus = async () => {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/meta/sync-status`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsSyncing(data.isSyncing);
          setJobsRemaining(data.jobsRemaining);

          if (
            data.isSyncing &&
            initialJobs === null &&
            data.jobsRemaining > 0
          ) {
            setInitialJobs(data.jobsRemaining);
          } else if (!data.isSyncing) {
            setInitialJobs(null);
          }
        }
      } catch (err) {}
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 5000);

    return () => clearInterval(interval);
  }, [initialJobs]);

  if (isSyncing) {
    const estimatedSeconds = jobsRemaining * 360;
    const etaMinutes = Math.max(1, Math.ceil(estimatedSeconds / 60));
    const progress =
      initialJobs && initialJobs >= jobsRemaining
        ? Math.max(
            5,
            Math.round(((initialJobs - jobsRemaining) / initialJobs) * 100),
          )
        : 15;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-500">
          {/* Top Graphic Area */}
          <div className="bg-slate-50 border-b border-gray-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background subtle gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-60">
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
              <div
                className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            <div className="relative z-10 flex items-center justify-center">
              {/* Cloud Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 relative z-10">
                <CloudDownload size={28} className="text-blue-600" />
              </div>

              {/* Connecting animated dots */}
              <div className="flex w-16 justify-center gap-1.5 px-2">
                <div
                  className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>

              {/* Server Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 relative z-10">
                <Server size={28} className="text-indigo-600" />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full p-1.5 shadow-md">
                  <Loader2 size={12} className="animate-spin" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Syncing your workspace
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
              We're securely downloading your historical data from Meta. You can
              safely leave this page, but keeping it open ensures the fastest
              sync.
            </p>

            {/* Progress Section */}
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Items Remaining
                  </p>
                  <p className="text-xl font-black text-gray-900">
                    {jobsRemaining}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Est. Time
                  </p>
                  <p className="text-xl font-black text-gray-900">
                    ~{etaMinutes}m
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
