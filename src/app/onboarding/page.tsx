"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  ApiError,
  authApi,
  CreateWorkspaceInput,
  Industry,
  Platform,
  TeamSize,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { PlatformIcon } from "@/components/ui/platform-icon";

const TEAM_SIZE_OPTIONS: TeamSize[] = ["1-5", "6-20", "21-100", "101-500", "500+"];

const INDUSTRY_OPTIONS: Array<{ value: Industry; label: string }> = [
  { value: "media", label: "Digital media" },
  { value: "agency", label: "Marketing agency" },
  { value: "ecommerce", label: "E-commerce brand" },
  { value: "creator", label: "Creator studio" },
  { value: "enterprise", label: "Enterprise" },
  { value: "other", label: "Other" },
];

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string; description: string }> = [
  { value: "facebook", label: "Facebook", description: "Pages, groups, ad insights" },
  { value: "instagram", label: "Instagram", description: "Reels, Stories, feed posts" },
  { value: "linkedin", label: "LinkedIn", description: "Company pages, follower analytics" },
  { value: "tiktok", label: "TikTok", description: "Video metrics, trends" },
];

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [teamSize, setTeamSize] = useState<TeamSize | "">("");
  const [industry, setIndustry] = useState<Industry | "">("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [orgNameError, setOrgNameError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [teamSizeError, setTeamSizeError] = useState("");
  const [industryError, setIndustryError] = useState("");
  const [platformsError, setPlatformsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncStep = () => {
      const currentStep = Number(new URLSearchParams(window.location.search).get("step") || "1");
      setStep(currentStep >= 1 && currentStep <= 3 ? currentStep : 1);
    };

    syncStep();
    window.addEventListener("popstate", syncStep);

    return () => {
      window.removeEventListener("popstate", syncStep);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const updateStep = (nextStep: number) => {
    setStep(nextStep);
    window.history.replaceState(null, "", `${pathname}?step=${nextStep}`);
    window.dispatchEvent(new Event("onboarding-step-change"));
    router.replace(`${pathname}?step=${nextStep}`, { scroll: false });
  };

  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    setOrgNameError("");

    if (!isSlugManuallyEdited) {
      setSlug(slugify(value));
      setSlugError("");
    }
  };

  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(value.toLowerCase());
    setSlugError("");
  };

  const validateStepOne = () => {
    let isValid = true;

    if (!orgName.trim()) {
      setOrgNameError("Organisation name is required");
      isValid = false;
    } else {
      setOrgNameError("");
    }

    if (!slug.trim()) {
      setSlugError("Workspace URL is required");
      isValid = false;
    } else if (!SLUG_PATTERN.test(slug)) {
      setSlugError("Use lowercase letters, numbers, and hyphens only");
      isValid = false;
    } else {
      setSlugError("");
    }

    return isValid;
  };

  const validateStepTwo = () => {
    let isValid = true;

    if (!teamSize) {
      setTeamSizeError("Select your team size");
      isValid = false;
    } else {
      setTeamSizeError("");
    }

    if (!industry) {
      setIndustryError("Select your industry");
      isValid = false;
    } else {
      setIndustryError("");
    }

    return isValid;
  };

  const validateStepThree = () => {
    if (platforms.length === 0) {
      setPlatformsError("Select at least one platform");
      return false;
    }

    setPlatformsError("");
    return true;
  };

  const togglePlatform = (platform: Platform) => {
    setPlatformsError("");
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((value) => value !== platform) : [...current, platform],
    );
  };

  const handleCreateWorkspace = async () => {
    setSubmitError("");

    const isStepOneValid = validateStepOne();
    const isStepTwoValid = validateStepTwo();
    const isStepThreeValid = validateStepThree();

    if (!isStepOneValid) {
      updateStep(1);
      return;
    }

    if (!isStepTwoValid) {
      updateStep(2);
      return;
    }

    if (!isStepThreeValid || !teamSize || !industry) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateWorkspaceInput = {
        orgName: orgName.trim(),
        slug: slug.trim(),
        teamSize,
        industry,
        platforms,
      };

      await authApi.createWorkspace(payload);

      await refreshAuth();
      router.replace("/dashboard");
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;

      if (status === 409) {
        setSlugError("This URL is already taken — try another");
        updateStep(1);
      } else {
        setSubmitError(error instanceof Error ? error.message : "Something went wrong while creating your workspace. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {step === 1 ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-950">Set up your workspace</h1>
            <p className="mt-2 text-sm text-gray-600">Start with the name and URL your team will use.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="org-name" className="mb-2 block text-sm font-medium text-gray-700">
                Organisation name
              </label>
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(event) => handleOrgNameChange(event.target.value)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-600/20",
                  orgNameError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-blue-600",
                )}
                placeholder="Acme Media"
              />
              {orgNameError ? <p className="mt-2 text-sm text-red-600">{orgNameError}</p> : null}
            </div>

            <div>
              <label htmlFor="workspace-slug" className="mb-2 block text-sm font-medium text-gray-700">
                Workspace URL
              </label>
              <div
                className={cn(
                  "flex items-center rounded-xl border bg-white px-4 py-3 transition focus-within:ring-2 focus-within:ring-blue-600/20",
                  slugError ? "border-red-300 focus-within:border-red-500" : "border-gray-300 focus-within:border-blue-600",
                )}
              >
                <span className="mr-2 shrink-0 text-sm text-gray-500">socialmetrics.io/</span>
                <input
                  id="workspace-slug"
                  type="text"
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  className="w-full border-0 p-0 text-sm text-gray-900 outline-none"
                  placeholder="acme-media"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">This will be your unique workspace identifier</p>
              {slug && !slugError && !SLUG_PATTERN.test(slug) ? (
                <p className="mt-2 text-sm text-red-600">Use lowercase letters, numbers, and hyphens only</p>
              ) : null}
              {slugError ? <p className="mt-2 text-sm text-red-600">{slugError}</p> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (validateStepOne()) {
                updateStep(2);
              }
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Continue →
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-950">Tell us about your team</h1>
            <p className="mt-2 text-sm text-gray-600">This helps tailor the workspace setup.</p>
          </div>

          <div className="space-y-6">
            <div>
              <span className="mb-3 block text-sm font-medium text-gray-700">Team size</span>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {TEAM_SIZE_OPTIONS.map((option) => {
                  const isSelected = teamSize === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setTeamSize(option);
                        setTeamSizeError("");
                      }}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm font-medium transition",
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {teamSizeError ? <p className="mt-2 text-sm text-red-600">{teamSizeError}</p> : null}
            </div>

            <div>
              <label htmlFor="industry" className="mb-2 block text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(event) => {
                  setIndustry(event.target.value as Industry);
                  setIndustryError("");
                }}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-600/20",
                  industryError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-blue-600",
                )}
              >
                <option value="">Select an industry</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {industryError ? <p className="mt-2 text-sm text-red-600">{industryError}</p> : null}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => updateStep(1)}
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStepTwo()) {
                  updateStep(3);
                }
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-950">Which platforms will you manage?</h1>
            <p className="mt-2 text-sm text-gray-600">Choose at least one to finish creating your workspace.</p>
          </div>

          {submitError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {PLATFORM_OPTIONS.map((platform) => {
              const isSelected = platforms.includes(platform.value);

              return (
                <label
                  key={platform.value}
                  className={cn(
                    "flex cursor-pointer gap-4 rounded-2xl border p-4 transition",
                    isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlatform(platform.value)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <div className="flex gap-3">
                    <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-200">
                      <PlatformIcon platform={platform.value} className="text-gray-900" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-950">{platform.label}</div>
                      <p className="mt-1 text-sm text-gray-600">{platform.description}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {platformsError ? <p className="text-sm text-red-600">{platformsError}</p> : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => updateStep(2)}
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleCreateWorkspace}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create my workspace →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
