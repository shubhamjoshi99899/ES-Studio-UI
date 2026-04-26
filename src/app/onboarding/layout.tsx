"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Onboarding step ${step} of 3`}>
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-colors",
            dot === step ? "bg-gray-950" : "bg-gray-300",
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isOnboarded } = useAuth();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/signup");
      return;
    }

    if (isOnboarded) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, isOnboarded, router]);

  useEffect(() => {
    const syncStep = () => {
      const rawStep = Number(new URLSearchParams(window.location.search).get("step") || "1");
      setStep(rawStep >= 1 && rawStep <= 3 ? rawStep : 1);
    };

    syncStep();
    window.addEventListener("popstate", syncStep);
    window.addEventListener("onboarding-step-change", syncStep);

    return () => {
      window.removeEventListener("popstate", syncStep);
      window.removeEventListener("onboarding-step-change", syncStep);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || isOnboarded) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">SocialMetrics</div>
          <div className="mt-6">
            <OnboardingProgress step={step} />
          </div>
        </div>

        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
