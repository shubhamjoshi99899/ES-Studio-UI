"use client";

export default function AutomationPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center pb-10">
      <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 6H28L29.5 11.5L35 14.5L40 12L44 19L39.5 23.5V24.5L44 29L40 36L35 33.5L29.5 36.5L28 42H20L18.5 36.5L13 33.5L8 36L4 29L8.5 24.5V23.5L4 19L8 12L13 14.5L18.5 11.5L20 6Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        </div>

        <div className="mt-6 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
          In development
        </div>

        <h1 className="mt-5 text-3xl font-semibold text-gray-950">Automation workflows</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
          Build triggers and actions to automate your social media workflows. Coming in the next update.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = "mailto:updates@socialmetrics.io";
          }}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Get notified when it&apos;s ready
        </button>
      </div>
    </div>
  );
}
