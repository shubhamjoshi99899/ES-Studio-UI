"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GlobalSyncScreen from "./GlobalSyncScreen";
import AIAssistantPanel from "@/features/ops/components/AIAssistantPanel";
import Protected from "@/components/protected";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStandalonePage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-email" ||
    pathname === "/onboarding" ||
    pathname === "/privacy" ||
    pathname === "/terms";
  const showGlobalAssistant = pathname !== "/ai-assistant";
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isStandalonePage) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    );
  }

  return (
    <Protected>
      <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-gray-950 transition-colors">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <div
          className={`flex flex-1 flex-col h-screen min-w-0 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-56"}`}
        >
          <Topbar />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5 xl:p-8">
            <GlobalSyncScreen>{children}</GlobalSyncScreen>
          </main>
          {showGlobalAssistant ? <AIAssistantPanel /> : null}
        </div>
      </div>
    </Protected>
  );
}
