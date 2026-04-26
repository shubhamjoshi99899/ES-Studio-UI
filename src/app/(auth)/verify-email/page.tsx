"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ApiError, authApi, getCurrentWorkspaceId, api } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

type VerificationState = "loading" | "success" | "error";
const PENDING_INVITE_TOKEN_KEY = "pendingInviteToken";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [state, setState] = useState<VerificationState>("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setState("error");
      return;
    }

    let isActive = true;

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);

        if (!isActive) {
          return;
        }

        setState("success");
        await refreshAuth();

        if (!isActive) {
          return;
        }

        const pendingInviteToken = sessionStorage.getItem(PENDING_INVITE_TOKEN_KEY);

        if (pendingInviteToken) {
          try {
            const inviteResponse = await api.acceptInvite(pendingInviteToken);

            if (!isActive) {
              return;
            }

            if (inviteResponse.workspaceId) {
              await authApi.switchWorkspace({ workspaceId: inviteResponse.workspaceId });
            }

            sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
          } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 410)) {
              sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
            }
          }
        }

        const user = await refreshAuth();

        if (!isActive) {
          return;
        }

        router.replace(getCurrentWorkspaceId(user) ? "/dashboard" : "/onboarding");
      } catch {
        if (isActive) {
          setState("error");
          window.setTimeout(() => {
            router.replace("/login?error=invalid_token");
          }, 1200);
        }
      }
    };

    void verify();

    return () => {
      isActive = false;
    };
  }, [refreshAuth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {state === "loading" ? (
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <h1 className="mt-4 text-xl font-semibold text-gray-950">Verifying your email...</h1>
          </div>
        ) : null}

        {state === "success" ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-950">Email verified. Setting up your workspace...</h1>
          </div>
        ) : null}

        {state === "error" ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-950">This verification link has expired or is invalid.</h1>
            <Link href="/login?error=invalid_token" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
              Continue to sign in
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
