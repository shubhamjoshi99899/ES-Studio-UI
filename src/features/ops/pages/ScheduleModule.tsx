"use client";

import { useMemo, useState } from "react";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import {
  CalendarDays,
  Clock3,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  Plus,
  RefreshCw,
  Video,
} from "lucide-react";
import { scheduleItems as seedItems, teamMembers } from "../data";
import { ScheduleItem } from "../types";
import {
  ActionButton,
  AvatarPill,
  Field,
  Input,
  MetricTile,
  Modal,
  PageHeader,
  SectionTitle,
  SegmentedControl,
  Select,
  StatusBadge,
  SurfaceCard,
  TextArea,
  cn,
} from "../components/primitives";

type CalendarMode = "month" | "week" | "day";

function buildCalendarDays(anchor: Date, mode: CalendarMode) {
  if (mode === "day") return [anchor];
  if (mode === "week") {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = addDays(startOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }), 6);
  return eachDayOfInterval({ start, end });
}

export default function ScheduleModule() {
  const [mode, setMode] = useState<CalendarMode>("month");
  const [anchorDate, setAnchorDate] = useState(new Date("2026-04-16"));
  const [items, setItems] = useState(seedItems);
  const [selectedId, setSelectedId] = useState(seedItems[0]?.id ?? "");
  const [dragId, setDragId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ScheduleItem>({
    id: "new-post",
    title: "",
    caption: "",
    hashtags: ["#socialmetrics"],
    platforms: ["Instagram"],
    status: "draft",
    date: "2026-04-22",
    time: "10:00",
    owner: "Jordan Lee",
    approvalOwner: "Ava Patel",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    campaign: "Spring Revenue Sprint",
  });

  const visibleDays = useMemo(() => buildCalendarDays(anchorDate, mode), [anchorDate, mode]);
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];

  const postsByDay = useMemo(() => {
    return visibleDays.map((day) => ({
      day,
      posts: items.filter((item) => isSameDay(parseISO(item.date), day)),
    }));
  }, [items, visibleDays]);

  const queueCandidates = items
    .filter((item) => ["approved", "draft", "review"].includes(item.status))
    .slice(0, 4);

  const reschedule = (postId: string, nextDate: string) => {
    setItems((current) => current.map((item) => (item.id === postId ? { ...item, date: nextDate } : item)));
  };

  const savePost = (status: ScheduleItem["status"]) => {
    const next = { ...draft, status, id: `post-${Date.now()}` };
    setItems((current) => [next, ...current]);
    setSelectedId(next.id);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Content Operations"
        title="Scheduling Command Center"
        description="Plan, review, approve, and publish multi-platform social content from a shared calendar with queue intelligence and collaboration workflows."
        actions={
          <>
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { label: "Month", value: "month" },
                { label: "Week", value: "week" },
                { label: "Day", value: "day" },
              ]}
            />
            <ActionButton tone="secondary" onClick={() => setModalOpen(true)}>
              <Plus size={16} />
              New Post
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricTile label="Scheduled this week" value="18" detail="+4 vs target" accent="positive" />
        <MetricTile label="Awaiting approval" value="6" detail="2 blockers" accent="warning" />
        <MetricTile label="Queue utilization" value="82%" detail="Best-time slots filled" accent="neutral" />
        <MetricTile label="Publish failures" value="1" detail="Retry pending" accent="critical" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <SurfaceCard className="overflow-hidden">
          <SectionTitle
            title={format(anchorDate, mode === "day" ? "EEEE, MMMM d" : "MMMM yyyy")}
            description="Drag posts to reschedule. Approval state and publish health stay attached."
            action={
              <div className="flex items-center gap-2">
                <ActionButton tone="ghost" onClick={() => setAnchorDate((current) => subMonths(current, 1))}>
                  Prev
                </ActionButton>
                <ActionButton tone="ghost" onClick={() => setAnchorDate(new Date("2026-04-16"))}>
                  Today
                </ActionButton>
                <ActionButton tone="ghost" onClick={() => setAnchorDate((current) => addMonths(current, 1))}>
                  Next
                </ActionButton>
              </div>
            }
          />

          <div className={cn("grid gap-3", mode === "day" ? "grid-cols-1" : "grid-cols-7")}>
            {postsByDay.map(({ day, posts }) => (
              <div
                key={day.toISOString()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragId) reschedule(dragId, format(day, "yyyy-MM-dd"));
                  setDragId(null);
                }}
                className={cn(
                  "min-h-[180px] rounded-[26px] border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40",
                  isSameDay(day, new Date("2026-04-16")) && "border-teal-400/70 ring-2 ring-teal-200 dark:ring-teal-500/20",
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {format(day, "EEE")}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                      {format(day, "d")}
                    </div>
                  </div>
                  {posts.length ? (
                    <div className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                      {posts.length}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      draggable
                      onDragStart={() => setDragId(post.id)}
                      onClick={() => setSelectedId(post.id)}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                        selectedId === post.id
                          ? "border-slate-950 bg-white dark:border-white dark:bg-slate-900"
                          : "border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/80",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <GripVertical size={14} className="text-slate-400" />
                            <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                              {post.title}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <StatusBadge value={post.status} />
                            <span className="text-xs text-slate-500 dark:text-slate-400">{post.time}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionTitle title="Post details" description="Preview, approval, and publishing state." />
            {selectedItem ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800">
                  <img src={selectedItem.mediaUrl} alt={selectedItem.title} className="h-52 w-full object-cover" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={selectedItem.status} />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {selectedItem.platforms.join(" + ")}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {selectedItem.mediaType}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{selectedItem.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedItem.caption}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.hashtags.map((tag) => (
                    <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid gap-3">
                  <AvatarPill initials="JL" label={`Owner: ${selectedItem.owner}`} />
                  <AvatarPill initials="AP" label={`Approver: ${selectedItem.approvalOwner}`} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton tone="secondary">
                    <RefreshCw size={16} />
                    Retry
                  </ActionButton>
                  <ActionButton tone="secondary" onClick={() => setModalOpen(true)}>
                    <CalendarDays size={16} />
                    Edit Post
                  </ActionButton>
                </div>
              </div>
            ) : null}
          </SurfaceCard>

          <SurfaceCard>
            <SectionTitle title="Smart queue" description="Suggested slots based on content mix and best-time windows." />
            <div className="space-y-3">
              {queueCandidates.map((item, index) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950 dark:text-white">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Suggested slot {index + 1}: {format(addDays(new Date("2026-04-17"), index), "EEE, MMM d")} at {index % 2 === 0 ? "09:30" : "15:00"}
                      </div>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post Composer"
        description="Compose once, preview per platform, then save as draft or schedule for approval."
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Field label="Post title">
              <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Launch teaser, carousel, case study..." />
            </Field>
            <Field label="Caption">
              <TextArea rows={7} value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} placeholder="Write the message, CTA, and narrative here." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Publish date">
                <Input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
              </Field>
              <Field label="Time">
                <Input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Owner">
                <Select value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Approval owner">
                <Select value={draft.approvalOwner} onChange={(event) => setDraft({ ...draft, approvalOwner: event.target.value })}>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Campaign">
                <Input value={draft.campaign} onChange={(event) => setDraft({ ...draft, campaign: event.target.value })} />
              </Field>
              <Field label="Media type">
                <Select value={draft.mediaType} onChange={(event) => setDraft({ ...draft, mediaType: event.target.value as ScheduleItem["mediaType"] })}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </Select>
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <SurfaceCard className="bg-slate-50/80 dark:bg-slate-950/40">
              <SectionTitle title="Preview" description="Platform-specific rendering for caption and media." />
              <div className="space-y-4">
                {draft.platforms.map((platform) => (
                  <div key={platform} className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-950 dark:text-white">{platform}</div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {draft.mediaType === "image" ? <ImageIcon size={14} className="inline" /> : <Video size={14} className="inline" />}{" "}
                        {draft.mediaType}
                      </span>
                    </div>
                    <img src={draft.mediaUrl} alt="Preview" className="h-44 w-full rounded-2xl object-cover" />
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{draft.caption || "Caption preview will appear here."}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <div className="flex flex-wrap justify-end gap-3">
              <ActionButton tone="secondary" onClick={() => savePost("draft")}>
                <Layers3 size={16} />
                Save Draft
              </ActionButton>
              <ActionButton onClick={() => savePost("scheduled")}>
                <Clock3 size={16} />
                Schedule Post
              </ActionButton>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
