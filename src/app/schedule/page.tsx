import React from "react";
import {
  Download,
  Plus,
  Instagram,
  Youtube,
  FileText,
  Music,
  Briefcase,
  Sparkles,
} from "lucide-react";

const calendarDays = [
  { date: "25", isCurrentMonth: false, posts: [] },
  { date: "26", isCurrentMonth: false, posts: [] },
  { date: "27", isCurrentMonth: false, posts: [] },
  { date: "28", isCurrentMonth: false, posts: [] },
  { date: "29", isCurrentMonth: false, posts: [] },
  { date: "30", isCurrentMonth: false, posts: [] },
  { date: "1", isCurrentMonth: true, posts: [] },
  { date: "2", isCurrentMonth: true, posts: [] },
  {
    date: "3",
    isCurrentMonth: true,
    posts: [
      {
        id: 1,
        title: "Product Launch",
        type: "instagram",
        color: "bg-pink-50 text-pink-600",
        icon: Instagram,
      },
    ],
  },
  { date: "4", isCurrentMonth: true, posts: [] },
  {
    date: "5",
    isCurrentMonth: true,
    isActive: true,
    posts: [
      {
        id: 2,
        title: "Demo Reel",
        type: "youtube",
        color: "bg-red-50 text-red-600",
        icon: Youtube,
      },
      {
        id: 3,
        title: "Blog Update",
        type: "web",
        color: "bg-indigo-50 text-indigo-600",
        icon: FileText,
      },
    ],
  },
  { date: "6", isCurrentMonth: true, posts: [] },
  { date: "7", isCurrentMonth: true, posts: [] },
  { date: "8", isCurrentMonth: true, posts: [] },
  { date: "9", isCurrentMonth: true, posts: [] },
  {
    date: "10",
    isCurrentMonth: true,
    posts: [
      {
        id: 4,
        title: "Hiring Post",
        type: "linkedin",
        color: "bg-blue-50 text-blue-600",
        icon: Briefcase,
      },
    ],
  },
  { date: "11", isCurrentMonth: true, posts: [] },
  {
    date: "12",
    isCurrentMonth: true,
    posts: [
      {
        id: 5,
        title: "Trendy Sound",
        type: "tiktok",
        color: "bg-gray-100 text-gray-700",
        icon: Music,
      },
    ],
  },
  { date: "13", isCurrentMonth: true, posts: [] },
  { date: "14", isCurrentMonth: true, posts: [] },
  { date: "15", isCurrentMonth: true, posts: [] },
  { date: "16", isCurrentMonth: true, posts: [] },
  {
    date: "17",
    isCurrentMonth: true,
    posts: [
      {
        id: 6,
        title: "Lifestyle Reel",
        type: "instagram",
        color: "bg-pink-50 text-pink-600",
        icon: Instagram,
      },
    ],
  },
  { date: "18", isCurrentMonth: true, posts: [] },
  { date: "19", isCurrentMonth: true, posts: [] },
  { date: "20", isCurrentMonth: true, posts: [] },
  { date: "21", isCurrentMonth: true, posts: [] },
  { date: "22", isCurrentMonth: true, posts: [] },
];

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Schedule</h2>
          <div className="flex items-center rounded-full bg-gray-100 p-1">
            <button className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold shadow-sm text-gray-900">
              Month
            </button>
            <button className="rounded-full px-4 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
              Week
            </button>
            <button className="rounded-full px-4 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
              Day
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">October 2023</h1>
            <p className="mt-1 text-sm text-gray-500">
              12 posts scheduled for this month
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">
              <Download size={16} /> Export
            </button>
            <button className="flex items-center gap-2 rounded-full bg-[#6366f1] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] shadow-sm">
              <Plus size={16} /> Schedule Post
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-7 gap-4 mb-4 text-center">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <div
                key={day}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] rounded-2xl p-3 transition-shadow hover:shadow-md ${
                  day.isActive
                    ? "border-2 border-[#6366f1] bg-indigo-50/10 relative"
                    : "border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                }`}
              >
                {day.isActive && (
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#6366f1]" />
                )}
                <span
                  className={`text-xs font-bold ${day.isCurrentMonth ? "text-gray-900" : "text-gray-300"}`}
                >
                  {day.date}
                </span>

                <div className="mt-2 space-y-1.5">
                  {day.posts.map((post) => {
                    const PostIcon = post.icon;
                    return (
                      <div
                        key={post.id}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-bold ${post.color}`}
                      >
                        <PostIcon size={12} strokeWidth={2.5} />
                        <span className="truncate">{post.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-8 pt-16">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Upcoming List
            </h3>
            <button className="text-[11px] font-bold text-[#6366f1] hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Autumn Sale Banner",
                time: "Tomorrow, 10:00 AM",
                color: "bg-emerald-400",
              },
              {
                title: "Product Feature Walkthrough",
                time: "Oct 7, 02:30 PM",
                color: "bg-red-400",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-orange-100 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=100&auto=format&fit=crop&sig=${i}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                    <div className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Drafts
            </h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-[#6366f1]">
              3
            </span>
          </div>
          <div className="space-y-2">
            {[
              "Behind the scenes video...",
              "New Team Member Intro",
              "Client Testimonial Post",
            ].map((draft, i) => (
              <div
                key={i}
                className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3"
              >
                <p className="text-sm font-semibold text-gray-900">{draft}</p>
                <p className="mt-0.5 text-[10px] italic text-gray-400">
                  No scheduled date yet
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] p-6 text-white shadow-lg relative overflow-hidden">
          <Sparkles
            className="absolute top-4 right-4 text-white/20"
            size={64}
          />
          <h3 className="text-lg font-bold">Go Premium</h3>
          <p className="mt-2 text-xs text-indigo-100 max-w-[80%] leading-relaxed">
            Unlimited posts and advanced analytics await.
          </p>
          <button className="mt-6 flex w-full items-center justify-between rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#6366f1] transition-transform hover:scale-[1.02]">
            Upgrade Now
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6366f1] text-white">
              <Plus size={14} strokeWidth={3} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
