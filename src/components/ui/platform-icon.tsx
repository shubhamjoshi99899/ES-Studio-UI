import { cn } from "@/lib/utils";

type Platform = "facebook" | "instagram" | "linkedin" | "tiktok";

interface PlatformIconProps {
  platform: Platform;
  size?: number;
  className?: string;
}

export function PlatformIcon({
  platform,
  size = 32,
  className,
}: PlatformIconProps) {
  const sharedProps = {
    viewBox: "0 0 32 32",
    width: size,
    height: size,
    className: cn("text-current", className),
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (platform === "facebook") {
    return (
      <svg {...sharedProps}>
        <rect x="4.5" y="4.5" width="23" height="23" rx="7" />
        <path
          d="M18.4 11.3h-2.1c-1.2 0-1.9.8-1.9 2.2v2h4l-.6 3.2h-3.4v7h-3.3v-7H9v-3.2h2.1V13c0-3 1.8-4.7 4.6-4.7h2.7v3Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg {...sharedProps}>
        <rect x="4.5" y="4.5" width="23" height="23" rx="7" />
        <rect x="10" y="10" width="12" height="12" rx="4" />
        <circle cx="16" cy="16" r="3.1" />
        <circle cx="21.4" cy="10.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (platform === "linkedin") {
    return (
      <svg {...sharedProps}>
        <rect x="4.5" y="4.5" width="23" height="23" rx="7" />
        <circle cx="11" cy="11.6" r="1.4" fill="currentColor" stroke="none" />
        <path d="M9.9 14.4v7.2" />
        <path d="M14.9 14.4v7.2" />
        <path d="M14.9 17.4c0-1.8 1.1-3 2.9-3 1.7 0 2.7 1.2 2.7 3.4v4.8" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <rect x="4.5" y="4.5" width="23" height="23" rx="7" />
      <path d="M18.3 11v5a4.6 4.6 0 1 1-3.7-4.5" />
      <path d="M18.3 11.2c1 .9 2.3 1.5 3.7 1.6" />
    </svg>
  );
}
