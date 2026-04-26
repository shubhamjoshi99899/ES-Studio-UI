"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus, Rocket } from "lucide-react";
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { campaigns as seedCampaigns, scheduleItems } from "../data";
import { Campaign, CampaignStatus } from "../types";
import {
  ActionButton,
  Field,
  Input,
  MetricTile,
  Modal,
  PageHeader,
  SectionTitle,
  StatusBadge,
  SurfaceCard,
} from "../components/primitives";

const timelineData = [
  { name: "Week 1", clicks: 1900, revenue: 6200 },
  { name: "Week 2", clicks: 2600, revenue: 8800 },
  { name: "Week 3", clicks: 3300, revenue: 12100 },
  { name: "Week 4", clicks: 4200, revenue: 15400 },
];

export default function CampaignsModule() {
  const [campaignList, setCampaignList] = useState(seedCampaigns);
  const [selectedId, setSelectedId] = useState(seedCampaigns[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Campaign>({
    id: "new-campaign",
    name: "",
    objective: "",
    platforms: ["Instagram", "Facebook"],
    budget: 10000,
    spend: 0,
    status: "draft",
    clicks: 0,
    engagement: 0,
    revenue: 0,
    start: "2026-04-18",
    end: "2026-05-18",
    assets: [],
    linkedPosts: [scheduleItems[0]?.id].filter(Boolean) as string[],
  });

  const selected = campaignList.find((item) => item.id === selectedId) ?? campaignList[0];
  const linkedPosts = useMemo(() => scheduleItems.filter((post) => selected?.linkedPosts.includes(post.id)), [selected]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Growth Programs"
        title="Campaign Management"
        description="Build campaigns that connect planning, publishing, creative assets, and downstream performance in one operating surface."
        actions={
          <ActionButton onClick={() => setOpen(true)}>
            <Plus size={16} />
            New Campaign
          </ActionButton>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricTile label="Active campaigns" value="4" detail="2 launching soon" accent="positive" />
        <MetricTile label="Pipeline influenced" value="$87.7k" detail="+14% month over month" accent="positive" />
        <MetricTile label="Average engagement" value="8.2%" detail="Across linked content" accent="neutral" />
        <MetricTile label="Budget at risk" value="$4.8k" detail="Needs creative refresh" accent="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <SurfaceCard className="space-y-3">
          <SectionTitle title="Campaigns" description="Objectives, budgets, and current stage." />
          {campaignList.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => setSelectedId(campaign.id)}
              className={`w-full rounded-[26px] border p-4 text-left transition ${selected?.id === campaign.id ? "border-slate-950 bg-slate-50 dark:border-white dark:bg-slate-800/70" : "border-slate-200 bg-white hover:border-teal-300 dark:border-slate-800 dark:bg-slate-950/50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-950 dark:text-white">{campaign.name}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{campaign.objective}</div>
                </div>
                <StatusBadge value={campaign.status} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Budget</div>
                  <div className="mt-1 font-semibold text-slate-950 dark:text-white">${campaign.budget.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Revenue</div>
                  <div className="mt-1 font-semibold text-slate-950 dark:text-white">${campaign.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Engagement</div>
                  <div className="mt-1 font-semibold text-slate-950 dark:text-white">{campaign.engagement}%</div>
                </div>
              </div>
            </button>
          ))}
        </SurfaceCard>

        <div className="space-y-6">
          {selected ? (
            <>
              <SurfaceCard>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge value={selected.status} />
                      {selected.platforms.map((platform) => (
                        <span key={platform} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {platform}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{selected.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{selected.objective}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton tone="secondary">
                      <Rocket size={16} />
                      Launch updates
                    </ActionButton>
                    <ActionButton tone="secondary">
                      <FolderKanban size={16} />
                      Attach asset
                    </ActionButton>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <MetricTile label="Budget" value={`$${selected.budget.toLocaleString()}`} detail={`Spent $${selected.spend.toLocaleString()}`} />
                  <MetricTile label="Clicks" value={selected.clicks.toLocaleString()} detail="Cross-channel" accent="neutral" />
                  <MetricTile label="Revenue" value={`$${selected.revenue.toLocaleString()}`} detail="Attributed" accent="positive" />
                  <MetricTile label="Timeline" value={`${selected.start.slice(5)} → ${selected.end.slice(5)}`} detail="Flight dates" accent="neutral" />
                </div>
              </SurfaceCard>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <SurfaceCard>
                  <SectionTitle title="Performance timeline" description="Weekly trend snapshot for campaign execution." />
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <defs>
                          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="url(#revenueFill)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </SurfaceCard>

                <SurfaceCard>
                  <SectionTitle title="Assets & linked posts" description="Creative inventory and publishing linkage." />
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {selected.assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                          <div>
                            <div className="text-sm font-semibold text-slate-950 dark:text-white">{asset.title}</div>
                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{asset.type} creative</div>
                          </div>
                          <StatusBadge value={asset.type} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {linkedPosts.map((post) => (
                        <div key={post.id} className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950/60">
                          <div className="text-sm font-semibold text-slate-950 dark:text-white">{post.title}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {post.date} at {post.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SurfaceCard>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create campaign" description="Set the objective, budget, and flight dates.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Campaign name">
            <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </Field>
          <Field label="Objective">
            <Input value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} />
          </Field>
          <Field label="Budget">
            <Input type="number" value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: Number(event.target.value) })} />
          </Field>
          <Field label="Status">
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CampaignStatus })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Start">
            <Input type="date" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} />
          </Field>
          <Field label="End">
            <Input type="date" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <ActionButton
            onClick={() => {
              const created = { ...draft, id: `camp-${Date.now()}` };
              setCampaignList((current) => [created, ...current]);
              setSelectedId(created.id);
              setOpen(false);
            }}
          >
            Create campaign
          </ActionButton>
        </div>
      </Modal>
    </div>
  );
}
