"use client";

const PREVIEW_PROMPTS = [
  "Which of my pages made the most money last month?",
  "Show me posts with the highest engagement rate this week",
  "Draft a caption for our upcoming product launch",
];

export default function AIAssistantPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center pb-10">
      <div className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white px-8 py-12 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M24 6L27.8 16.2L38 20L27.8 23.8L24 34L20.2 23.8L10 20L20.2 16.2L24 6Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M36 8L37.5 12.5L42 14L37.5 15.5L36 20L34.5 15.5L30 14L34.5 12.5L36 8Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M12 28L13.5 32.5L18 34L13.5 35.5L12 40L10.5 35.5L6 34L10.5 32.5L12 28Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mt-6 inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-800">
            Coming soon
          </div>

          <h1 className="mt-5 text-3xl font-semibold text-gray-950">AI assistant</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Ask questions about your analytics, get content suggestions, and take actions across your workspace — powered by AI.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {PREVIEW_PROMPTS.map((prompt) => (
            <div
              key={prompt}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7 11V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <rect
                    x="5"
                    y="11"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span className="flex-1">{prompt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
