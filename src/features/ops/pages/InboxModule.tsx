"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, MessageCircleReply, NotebookPen, Sparkles } from "lucide-react";
import { inboxMessages as seedMessages, teamMembers } from "../data";
import { InboxMessage, InboxStatus, Platform, Priority } from "../types";
import {
  ActionButton,
  Input,
  PageHeader,
  SectionTitle,
  StatusBadge,
  SurfaceCard,
} from "../components/primitives";

export default function InboxModule() {
  const [messages, setMessages] = useState(seedMessages);
  const [activeId, setActiveId] = useState(seedMessages[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<Platform | "All">("All");
  const [status, setStatus] = useState<InboxStatus | "all">("all");
  const [assignedTo, setAssignedTo] = useState<string>("All");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [reply, setReply] = useState("");

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (platform !== "All" && message.platform !== platform) return false;
      if (status !== "all" && message.status !== status) return false;
      if (assignedTo !== "All" && message.assignedTo !== assignedTo) return false;
      if (priority !== "all" && message.priority !== priority) return false;
      const haystack = `${message.customer} ${message.handle} ${message.thread.map((entry) => entry.message).join(" ")}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [assignedTo, messages, platform, priority, search, status]);

  const active = filteredMessages.find((message) => message.id === activeId) ?? filteredMessages[0];

  const updateStatus = (nextStatus: InboxStatus) => {
    if (!active) return;
    setMessages((current) => current.map((message) => (message.id === active.id ? { ...message, status: nextStatus } : message)));
  };

  const addReply = (kind: "agent" | "note") => {
    if (!active || !reply.trim()) return;
    const nextMessage: InboxMessage = {
      ...active,
      thread: [
        ...active.thread,
        {
          id: `thread-${Date.now()}`,
          author: kind === "agent" ? "SocialMetrics" : "Internal note",
          kind,
          message: reply.trim(),
          time: "Just now",
        },
      ],
    };
    setMessages((current) => current.map((message) => (message.id === active.id ? nextMessage : message)));
    setReply("");
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Customer Operations"
        title="Smart Inbox"
        description="Unify messages, comments, and mentions across Facebook and Instagram with ownership, internal notes, resolution states, and AI-assisted replies."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton tone="secondary">
              <Sparkles size={16} />
              Suggest Reply
            </ActionButton>
            <ActionButton tone="secondary">
              <CheckCircle2 size={16} />
              Mark All Resolved
            </ActionButton>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
        <SurfaceCard className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden">
          <SectionTitle title="Conversations" description="Live feed with triage filters." />
          <div className="space-y-3">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages, users, tags" />
            <div className="grid grid-cols-2 gap-2">
              <select value={platform} onChange={(event) => setPlatform(event.target.value as Platform | "All")} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="All">All platforms</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value as InboxStatus | "all")} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="all">All status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="All">All owners</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority | "all")} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="all">All priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => setActiveId(message.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition ${active?.id === message.id ? "border-slate-950 bg-slate-50 dark:border-white dark:bg-slate-800/70" : "border-slate-200 bg-white hover:border-teal-300 dark:border-slate-800 dark:bg-slate-950/50"}`}
              >
                <div className="flex items-start gap-3">
                  <img src={message.avatar} alt={message.customer} className="h-11 w-11 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{message.customer}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{message.handle}</div>
                      </div>
                      <div className="text-xs text-slate-400">{message.lastSeen}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge value={message.platform} />
                      <StatusBadge value={message.status} />
                      <StatusBadge value={message.priority} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {message.thread[message.thread.length - 1]?.message}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden">
          {active ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={active.avatar} alt={active.customer} className="h-14 w-14 rounded-[20px] object-cover" />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{active.customer}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge value={active.platform} />
                      <StatusBadge value={active.status} />
                      <StatusBadge value={active.priority} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton tone="secondary" onClick={() => updateStatus("pending")}>
                    Pending
                  </ActionButton>
                  <ActionButton tone="secondary" onClick={() => updateStatus("resolved")}>
                    Resolve
                  </ActionButton>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto rounded-[28px] bg-slate-50 p-4 dark:bg-slate-950/60">
                {active.thread.map((entry) => (
                  <div
                    key={entry.id}
                    className={`max-w-[82%] rounded-[24px] px-4 py-3 text-sm leading-6 ${
                      entry.kind === "customer"
                        ? "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        : entry.kind === "agent"
                          ? "ml-auto bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}
                  >
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                      {entry.author} • {entry.time}
                    </div>
                    {entry.message}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Reply to the customer or add an internal note"
                  className="w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none dark:text-white"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton tone="secondary" onClick={() => addReply("note")}>
                      <NotebookPen size={16} />
                      Add Note
                    </ActionButton>
                    <ActionButton tone="secondary">
                      <Bot size={16} />
                      Suggest Reply
                    </ActionButton>
                  </div>
                  <ActionButton onClick={() => addReply("agent")}>
                    <MessageCircleReply size={16} />
                    Send Reply
                  </ActionButton>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No conversations match the current filters.
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="h-[calc(100vh-12rem)] overflow-y-auto">
          {active ? (
            <>
              <SectionTitle title="Customer profile" description="Context for faster, more accurate replies." />
              <div className="space-y-4">
                <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-950 dark:text-white">Assigned owner</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{active.assignedTo}</div>
                </div>

                <div className="grid gap-3">
                  {active.history.map((entry) => (
                    <div key={entry.label} className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{entry.label}</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{entry.value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {active.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">Quick replies</div>
                  <div className="space-y-2">
                    {[
                      "Thanks for reaching out. I’m pulling the exact breakdown for you now.",
                      "Sharing a short permissions matrix and next-step summary.",
                      "Looping in the campaign owner so you get a final answer today.",
                    ].map((template) => (
                      <button key={template} onClick={() => setReply(template)} className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-teal-300 hover:text-slate-950 dark:border-slate-800 dark:text-slate-300">
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SurfaceCard>
      </div>
    </div>
  );
}
