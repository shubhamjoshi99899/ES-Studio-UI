"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login" || pathname === "/privacy") return;

    // Check auth by hitting a protected endpoint — the HttpOnly cookie
    // is sent automatically via axios withCredentials: true
    apiClient
      .get("/api/auth/meta/sync-status")
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.replace("/login");
        }
        // Network errors — don't redirect, let the page handle it
      });
  }, [pathname, router]);
}
