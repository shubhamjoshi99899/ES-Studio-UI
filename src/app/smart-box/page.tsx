"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  MoreHorizontal,
  Send,
  Twitter,
  Instagram,
  Linkedin,
  MessageSquare,
} from "lucide-react";

const inboxMessages = [
  {
    id: 1,
    sender: "Sarah Jenkins",
    handle: "@sjenkins_design",
    platform: "Twitter",
    type: "Mention",
    time: "12m ago",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
    preview:
      "Absolutely loving the new update! The analytics are so much clearer now. Great job team 🚀",
    isUnread: true,
    platformColor: "text-blue-500 bg-blue-50",
  },
  {
    id: 2,
    sender: "TechCorp Official",
    handle: "@techcorp_inc",
    platform: "LinkedIn",
    type: "Comment",
    time: "2h ago",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop",
    preview:
      "This is exactly the breakdown we needed for our Q3 reporting. Will there be an export to PDF feature soon?",
    isUnread: true,
    platformColor: "text-indigo-600 bg-indigo-50",
  },
  {
    id: 3,
    sender: "Marcus Chen",
    handle: "@marcus_c",
    platform: "Instagram",
    type: "Direct Message",
    time: "5h ago",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop",
    preview:
      "Hi! I saw your recent post about the premium plan. Can you send me the pricing details for an agency of 10?",
    isUnread: false,
    platformColor: "text-pink-600 bg-pink-50",
  },
  {
    id: 4,
    sender: "Elena Rodriguez",
    handle: "@elena_marketing",
    platform: "Twitter",
    type: "Reply",
    time: "1d ago",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
    preview:
      "Thanks for sharing this guide. Found the section on audience retention especially helpful.",
    isUnread: false,
    platformColor: "text-blue-500 bg-blue-50",
  },
];

export default function SmartBoxPage() {
  const [activeMessageId, setActiveMessageId] = useState(1);

  const activeMessage =
    inboxMessages.find((m) => m.id === activeMessageId) || inboxMessages[0];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Twitter":
        return <Twitter size={14} />;
      case "Instagram":
        return <Instagram size={14} />;
      case "LinkedIn":
        return <Linkedin size={14} />;
      default:
        return <MessageSquare size={14} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Box</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all cross-channel conversations in one unified inbox.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">
            <CheckCircle size={16} className="text-gray-400" /> Mark All Read
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <div className="flex w-1/3 flex-col rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="border-b border-gray-100 p-4 shrink-0">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <button className="flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50">
                <Filter size={18} />
              </button>
            </div>

            <div className="mt-4 flex gap-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <button className="text-[#6366f1] border-b-2 border-[#6366f1] pb-1">
                Needs Action (2)
              </button>
              <button className="hover:text-gray-900 pb-1">All Messages</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inboxMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setActiveMessageId(msg.id)}
                className={`w-full flex items-start gap-3 border-b border-gray-50 p-4 text-left transition-colors hover:bg-gray-50/50 ${
                  activeMessageId === msg.id ? "bg-indigo-50/30" : "bg-white"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={msg.avatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${msg.platformColor}`}
                  >
                    {getPlatformIcon(msg.platform)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className={`text-sm truncate ${msg.isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}
                    >
                      {msg.sender}
                    </p>
                    <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap ml-2">
                      {msg.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">
                    {msg.type} • {msg.handle}
                  </p>
                  <p
                    className={`text-sm line-clamp-2 ${msg.isUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}
                  >
                    {msg.preview}
                  </p>
                </div>

                {msg.isUnread && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#6366f1]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 p-6 shrink-0">
            <div className="flex items-center gap-4">
              <img
                src={activeMessage.avatar}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {activeMessage.sender}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${activeMessage.platformColor}`}
                  >
                    {getPlatformIcon(activeMessage.platform)}
                    {activeMessage.platform}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {activeMessage.handle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <CheckCircle size={16} className="text-green-600" /> Resolve
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#fcfcfd]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Today, {activeMessage.time}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <img
                  src={activeMessage.avatar}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover shrink-0"
                />
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {activeMessage.sender}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activeMessage.type}
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {activeMessage.preview}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 p-4 shrink-0 bg-white">
            <div className="rounded-xl border border-gray-200 bg-gray-50 focus-within:border-[#6366f1] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#6366f1] transition-all">
              <textarea
                rows={3}
                placeholder="Type your reply here..."
                className="w-full resize-none bg-transparent p-4 text-sm outline-none placeholder:text-gray-400"
              />
              <div className="flex items-center justify-between border-t border-gray-100 p-2">
                <div className="flex gap-2 px-2">
                  <button className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900">
                    Add Internal Note
                  </button>
                </div>
                <button className="flex items-center gap-2 rounded-full bg-[#6366f1] px-5 py-2 text-sm font-bold text-white hover:bg-[#4f46e5]">
                  <Send size={14} /> Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
