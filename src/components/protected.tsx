"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Protected({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isOnboarded } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/signup");
      return;
    }

    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isLoading, isOnboarded, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !isOnboarded) {
    return null;
  }

  return <>{children}</>;
}
