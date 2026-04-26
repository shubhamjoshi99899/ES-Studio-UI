"use client";

import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.25)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ActionButton({
  children,
  tone = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost";
}) {
  const tones = {
    primary:
      "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
    ghost:
      "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  } as const;

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
        tones[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "neutral" | "positive" | "warning" | "critical";
}) {
  const accentClass = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  }[accent];

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold text-slate-950 dark:text-white">{value}</div>
        <div className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", accentClass)}>
          {detail}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const normalized = value.toLowerCase();
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    review: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    approved: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
    scheduled: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    open: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    admin: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
    analyst: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
    "content manager": "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
    invited: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
    medium: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
    low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    image: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
    video: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        styles[normalized] || styles.draft,
        className,
      )}
    >
      {value}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</div>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white",
        props.className,
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white",
        props.className,
      )}
    />
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <ActionButton tone="ghost" onClick={onClose}>
            Close
          </ActionButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AvatarPill({
  initials,
  label,
}: {
  initials: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
        {initials}
      </span>
      {label}
    </div>
  );
}
