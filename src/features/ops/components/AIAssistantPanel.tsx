"use client";

import { Sparkles, Wand2, ArrowRight, Bot } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ActionButton,
  Input,
  SectionTitle,
  SurfaceCard,
} from "./primitives";

const pagePrompts: Record<string, string[]> = {
  "/traffic": [
    "Why did traffic drop last week?",
    "What pages drove returning users?",
  ],
  "/reports": [
    "Which profile gained the most followers?",
    "Show me top-performing post patterns",
  ],
  "/revenue": [
    "Which team drove the most revenue?",
    "Where did conversion efficiency fall?",
  ],
  "/schedule": [
    "Find gaps in next week's publishing plan",
    "Suggest the best time slots for Instagram",
  ],
  "/smart-box": [
    "Which conversations are at churn risk?",
    "Draft a high-confidence reply for VIP leads",
  ],
  "/campaigns": [
    "Which active campaign needs budget attention?",
    "Find campaigns with strong revenue efficiency",
  ],
  "/insights": [
    "Summarize the biggest anomalies today",
    "Which alert rules should I tighten?",
  ],
};

export default function AIAssistantPanel({ initialOpen = false }: { initialOpen?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(initialOpen);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "assistant-1",
      role: "assistant",
      text:
        "I can summarize performance, explain anomalies, and suggest next actions based on the page you are viewing.",
    },
  ]);

  const suggestions = useMemo(
    () =>
      pagePrompts[pathname]?.length
        ? pagePrompts[pathname]
        : [
            "What should the team focus on today?",
            "Highlight the biggest opportunities in this workspace",
          ],
    [pathname],
  );

  const submit = (input: string) => {
    const value = input.trim();
    if (!value) return;

    setMessages((current) => [
      ...current,
      { id: `user-${current.length}`, role: "user", text: value },
      {
        id: `assistant-${current.length + 1}`,
        role: "assistant",
        text:
          pathname === "/schedule"
            ? "Posting gaps are concentrated on Tuesday and Thursday afternoons. I’d move one approved Instagram asset into the Tuesday 9:30 AM slot and clone the morning reel format for Thursday."
            : pathname === "/smart-box"
              ? "The highest-priority thread is Sarah Jenkins because intent is strong and the account is tagged VIP. Suggested next step: send the permissions breakdown, then assign follow-up to sales."
              : pathname === "/campaigns"
                ? "Spring Revenue Sprint has the strongest revenue efficiency so far. Executive Brand Lift is under-spending and should either receive more creative assets or a tighter objective."
                : "The clearest story is that operational delays are affecting downstream performance. I’d tighten alert thresholds around publishing failures, then route those alerts to the content manager and analyst.",
      },
    ]);
    setQuestion("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-[0_24px_60px_-18px_rgba(15,23,42,0.6)] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        <Sparkles size={16} />
        Ask AI
      </button>

      {open ? (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-[#f7faf9] p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <SurfaceCard className="flex h-full flex-col bg-white/85 dark:bg-slate-900/85">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  <Bot size={14} />
                  Contextual Assistant
                </div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  SocialMetrics AI
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Page-aware recommendations with operational next steps.
                </p>
              </div>
              <ActionButton tone="ghost" onClick={() => setOpen(false)}>
                Close
              </ActionButton>
            </div>

            <div className="mb-4">
              <SectionTitle
                title="Suggested questions"
                description="These adapt to the current module."
              />
              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => submit(item)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-teal-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto rounded-[24px] bg-slate-50 p-3 dark:bg-slate-950/70">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      : "ml-auto bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-[24px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about this page, campaign, alert, or conversation"
                  className="border-none px-1 py-1"
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Wand2 size={12} />
                    Uses current page context
                  </div>
                  <ActionButton onClick={() => submit(question)}>
                    Ask
                    <ArrowRight size={16} />
                  </ActionButton>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
    </>
  );
}
