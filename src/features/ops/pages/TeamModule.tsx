"use client";

import { useState } from "react";
import { MailPlus, ShieldCheck } from "lucide-react";
import { auditLog, teamMembers as seedMembers } from "../data";
import { Role } from "../types";
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

export default function TeamModule() {
  const [members, setMembers] = useState(seedMembers);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Analyst");

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Workspace Governance"
        title="Team & Roles"
        description="Manage invitations, access roles, permissions, and audit logs for enterprise-grade collaboration across analytics and operations."
        actions={
          <ActionButton onClick={() => setOpen(true)}>
            <MailPlus size={16} />
            Invite User
          </ActionButton>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricTile label="Active members" value="12" detail="3 region leads" accent="neutral" />
        <MetricTile label="Pending invites" value="2" detail="Awaiting acceptance" accent="warning" />
        <MetricTile label="Admins" value="3" detail="Privileged access" accent="critical" />
        <MetricTile label="Audit events" value="148" detail="Last 7 days" accent="positive" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionTitle title="Members" description="Role-based access with explicit permissions." />
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                      {member.initials}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-slate-950 dark:text-white">{member.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={member.role} />
                    <StatusBadge value={member.status} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {member.permissions.map((permission) => (
                    <span key={permission} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {permission}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">Last active: {member.lastActive}</div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionTitle title="Permission model" description="Default access bands for common roles." />
            <div className="space-y-3">
              {[
                { role: "Admin", permissions: "Full workspace management, campaign controls, mappings, approvals" },
                { role: "Analyst", permissions: "View dashboards, build alerts, export insights, no publishing" },
                { role: "Content Manager", permissions: "Schedule content, manage inbox, operate campaigns" },
              ].map((entry) => (
                <div key={entry.role} className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950/60">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-500" />
                    <StatusBadge value={entry.role} />
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{entry.permissions}</div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionTitle title="Activity log" description="Recent audit events across the workspace." />
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="rounded-[22px] border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-950 dark:text-white">{entry.actor}</span> {entry.action} <span className="font-semibold text-slate-950 dark:text-white">{entry.target}</span>
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{entry.at}</div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Invite teammate" description="Provision access by role and send an email invitation.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <option value="Admin">Admin</option>
              <option value="Analyst">Analyst</option>
              <option value="Content Manager">Content Manager</option>
            </select>
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <ActionButton
            onClick={() => {
              setMembers((current) => [
                {
                  id: `user-${Date.now()}`,
                  name,
                  email,
                  role,
                  permissions:
                    role === "Admin"
                      ? ["View all", "Manage campaigns", "Edit mappings", "Approve content"]
                      : role === "Analyst"
                        ? ["View dashboards", "Create insights", "Manage alerts"]
                        : ["Schedule content", "Reply in inbox", "Manage campaigns"],
                  status: "invited",
                  lastActive: "Pending invite",
                  initials: name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join(""),
                },
                ...current,
              ]);
              setOpen(false);
              setName("");
              setEmail("");
              setRole("Analyst");
            }}
          >
            Send invite
          </ActionButton>
        </div>
      </Modal>
    </div>
  );
}
