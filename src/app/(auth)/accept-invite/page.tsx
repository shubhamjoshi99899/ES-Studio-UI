"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ApiError, authApi, api } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

const PENDING_INVITE_TOKEN_KEY = "pendingInviteToken";

type InviteState = "loading" | "error";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, isAuthenticated, refreshAuth } = useAuth();
  const [state, setState] = useState<InviteState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const token = searchParams.get("token");
    const workspace = searchParams.get("workspace");

    if (!token || !workspace) {
      setState("error");
      setErrorMessage("This invite link is invalid.");
      return;
    }

    let isActive = true;

    const acceptInvite = async () => {
      if (!isAuthenticated) {
        sessionStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
        router.replace("/signup?invite=true");
        return;
      }

      try {
        const response = await api.acceptInvite(token);

        if (!isActive) {
          return;
        }

        if (response.workspaceId) {
          await authApi.switchWorkspace({ workspaceId: response.workspaceId });
        }

        await refreshAuth();

        if (!isActive) {
          return;
        }

        sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
        router.push("/dashboard");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 410)) {
          setState("error");
          setErrorMessage("This invite has expired or already been used");
          return;
        }

        setState("error");
        setErrorMessage("Failed to join workspace");
      }
    };

    void acceptInvite();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isLoading, refreshAuth, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {state === "loading" ? (
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <h1 className="mt-4 text-xl font-semibold text-gray-950">Joining workspace...</h1>
          </div>
        ) : null}

        {state === "error" ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-950">{errorMessage}</h1>
          </div>
        ) : null}
      </div>
    </div>
  );
}
