"use client";

import { BellRing, ChevronRight, Mail, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { alertRules as seedRules, insights } from "../data";
import { AlertRule } from "../types";
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

export default function InsightsModule() {
  const [rules, setRules] = useState(seedRules);
  const [open, setOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<AlertRule>({
    id: "new-rule",
    name: "",
    metric: "Traffic",
    operator: ">",
    threshold: "",
    destination: { inApp: true, email: false },
    enabled: true,
  });

  const createRule = () => {
    setRules((current) => [{ ...ruleDraft, id: `rule-${Date.now()}` }, ...current]);
    setOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Signal Intelligence"
        title="Alerts & Insights"
        description="Monitor automated anomalies, surface high-signal opportunities, and build custom rules that notify the team when performance changes matter."
        actions={
          <ActionButton onClick={() => setOpen(true)}>
            <Plus size={16} />
            New Alert Rule
          </ActionButton>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricTile label="Active rules" value="8" detail="6 live notifications" accent="neutral" />
        <MetricTile label="Critical alerts" value="2" detail="Investigate today" accent="critical" />
        <MetricTile label="Positive insights" value="5" detail="High-confidence patterns" accent="positive" />
        <MetricTile label="Email delivery" value="94%" detail="Stable" accent="neutral" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionTitle title="Insight feed" description="Automatically generated cards from cross-module performance signals." />
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge value={insight.severity} />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{insight.metric}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{insight.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{insight.summary}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${insight.delta.startsWith("-") ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                    {insight.delta.startsWith("-") ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                    {insight.delta}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{insight.action}</div>
                  <ActionButton tone="ghost">
                    Investigate
                    <ChevronRight size={16} />
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionTitle title="Rule engine" description="Custom thresholds for traffic, engagement, and revenue." />
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-950 dark:text-white">{rule.name}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      If {rule.metric} {rule.operator === "drop" ? "drops by" : rule.operator} {rule.threshold}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() =>
                        setRules((current) =>
                          current.map((item) => (item.id === rule.id ? { ...item, enabled: !item.enabled } : item)),
                        )
                      }
                    />
                    Enabled
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rule.destination.inApp ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <BellRing size={12} className="mr-1 inline" />
                      In-app
                    </span>
                  ) : null}
                  {rule.destination.email ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Mail size={12} className="mr-1 inline" />
                      Email
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create alert rule" description="Configure the metric, threshold, and notification channels.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Rule name">
            <Input value={ruleDraft.name} onChange={(event) => setRuleDraft({ ...ruleDraft, name: event.target.value })} />
          </Field>
          <Field label="Metric">
            <Input value={ruleDraft.metric} onChange={(event) => setRuleDraft({ ...ruleDraft, metric: event.target.value })} />
          </Field>
          <Field label="Operator">
            <select value={ruleDraft.operator} onChange={(event) => setRuleDraft({ ...ruleDraft, operator: event.target.value as AlertRule["operator"] })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <option value=">">Greater than</option>
              <option value="<">Less than</option>
              <option value="drop">Drops by</option>
            </select>
          </Field>
          <Field label="Threshold">
            <Input value={ruleDraft.threshold} onChange={(event) => setRuleDraft({ ...ruleDraft, threshold: event.target.value })} placeholder="e.g. 20% or 1,500" />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={ruleDraft.destination.inApp} onChange={() => setRuleDraft({ ...ruleDraft, destination: { ...ruleDraft.destination, inApp: !ruleDraft.destination.inApp } })} />
            In-app notifications
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={ruleDraft.destination.email} onChange={() => setRuleDraft({ ...ruleDraft, destination: { ...ruleDraft.destination, email: !ruleDraft.destination.email } })} />
            Email notifications
          </label>
          <ActionButton onClick={createRule}>Create rule</ActionButton>
        </div>
      </Modal>
    </div>
  );
}
