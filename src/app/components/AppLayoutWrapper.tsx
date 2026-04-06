"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GlobalSyncScreen from "./GlobalSyncScreen";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [isCollapsed, setIsCollapsed] = useState(false);

  useAuth();

  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-gray-950 transition-colors">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div
        className={`flex flex-1 flex-col h-screen min-w-0 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-56"}`}
      >
        <Topbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5 xl:p-8">
          <GlobalSyncScreen>{children}</GlobalSyncScreen>
        </main>
      </div>
    </div>
  );
}
