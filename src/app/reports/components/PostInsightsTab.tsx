import React, { useEffect, useState } from "react";
import {
  LayoutGrid,
  List,
  Download,
  CheckSquare,
  Square,
  Facebook,
  Instagram,
  Tag,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video,
  Link2,
  FileText,
  ExternalLink,
} from "lucide-react";
import DateRangePicker from "../../components/DateRangePicker";
import { Profile } from "../types";

interface PostData {
  postId: string;
  profileId: string;
  platform: "facebook" | "instagram";
  postType: string;
  message: string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  isPublished: boolean;
  isBoosted: boolean;
  authorName: string;
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  views: number;
  clicks: number;
}

type SortMetric =
  | "date"
  | "reach"
  | "engagements"
  | "engagementRate"
  | "likes"
  | "comments"
  | "shares"
  | "clicks"
  | "views";

export default function PostInsightsTab({
  selectedProfileIds,
  profiles,
}: {
  selectedProfileIds: string[];
  profiles: Profile[];
}) {
  const initEnd = new Date();
  const initStart = new Date();
  initStart.setDate(initStart.getDate() - 30);

  const [startDate, setStartDate] = useState(
    initStart.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(initEnd.toISOString().split("T")[0]);
  const [preset, setPreset] = useState<string>("30");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [sortMetric, setSortMetric] = useState<SortMetric>("date");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = viewMode === "grid" ? 20 : 30;

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    if (selectedProfileIds.length === 0) {
      setPosts([]);
      return;
    }
    
    setLoading(true);
    fetch(`${BACKEND_URL}/api/analytics/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        profileIds: selectedProfileIds,
        startDate,
        endDate,
      }),
    })
    .then((res) => res.json())
    .then((data) => {
      setPosts(data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [selectedProfileIds, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    sourceFilter,
    typeFilter,
    statusFilter,
    authorFilter,
    sortOrder,
    sortMetric,
    viewMode,
  ]);

  const uniqueAuthors = Array.from(
    new Set(posts.map((p) => p.authorName).filter(Boolean)),
  );
  const filteredPosts = posts
    .filter((post) => {
      if (sourceFilter !== "all" && post.profileId !== sourceFilter)
        return false;

      if (typeFilter !== "all") {
        const isVid =
          post.postType.includes("video") || post.postType === "REELS";
        const isImg =
          post.postType.includes("photo") || post.postType === "image";
        const isLnk = post.postType === "link";

        if (typeFilter === "video" && !isVid) return false;
        if (typeFilter === "photo" && !isImg) return false;
        if (typeFilter === "link" && !isLnk) return false;
        if (typeFilter === "text" && (isVid || isImg || isLnk)) return false;
      }

      if (statusFilter !== "all") {
        if (statusFilter === "published" && !post.isPublished) return false;
        if (statusFilter === "unpublished" && post.isPublished) return false;
        if (statusFilter === "boosted" && !post.isBoosted) return false;
      }

      if (authorFilter !== "all" && post.authorName !== authorFilter)
        return false;

      return true;
    })
    .sort((a, b) => {
      let valA = 0,
        valB = 0;
      const engA = a.likes + a.comments + a.shares + a.clicks;
      const engB = b.likes + b.comments + b.shares + b.clicks;

      switch (sortMetric) {
        case "reach":
          valA = a.reach;
          valB = b.reach;
          break;
        case "engagements":
          valA = engA;
          valB = engB;
          break;
        case "engagementRate":
          valA = a.reach > 0 ? engA / a.reach : 0;
          valB = b.reach > 0 ? engB / b.reach : 0;
          break;
        case "likes":
          valA = a.likes;
          valB = b.likes;
          break;
        case "comments":
          valA = a.comments;
          valB = b.comments;
          break;
        case "shares":
          valA = a.shares;
          valB = b.shares;
          break;
        case "clicks":
          valA = a.clicks;
          valB = b.clicks;
          break;
        case "views":
          valA = a.views;
          valB = b.views;
          break;
        case "date":
        default:
          valA = new Date(a.postedAt).getTime();
          valB = new Date(b.postedAt).getTime();
          break;
      }
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(
    startIndex,
    startIndex + postsPerPage,
  );

  const clearAllFilters = () => {
    setSourceFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setAuthorFilter("all");
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === currentPosts.length) setSelectedPosts([]);
    else setSelectedPosts(currentPosts.map((p) => p.postId));
  };

  const toggleSelectPost = (postId: string) => {
    if (selectedPosts.includes(postId))
      setSelectedPosts(selectedPosts.filter((id) => id !== postId));
    else setSelectedPosts([...selectedPosts, postId]);
  };

  const getProfileName = (id: string) =>
    profiles.find((p) => p.profileId === id)?.name || "Unknown Profile";

  const getTypeIcon = (type: string) => {
    if (type.includes("video") || type === "REELS")
      return <Video size={14} className="text-white" />;
    if (type.includes("photo") || type === "image")
      return <ImageIcon size={14} className="text-white" />;
    if (type === "link") return <Link2 size={14} className="text-white" />;
    return <FileText size={14} className="text-white" />;
  };

  const getCleanTypeString = (type: string) => {
    if (type.includes("video") || type === "REELS") return "Video";
    if (type.includes("photo") || type === "image") return "Photo";
    if (type === "link") return "Link";
    return "Text";
  };

  const formatDateString = (dateString: string) => {
    const d = new Date(dateString);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    const time = d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `${dayName} ${month}/${day}/${year} ${time}`;
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== "custom") {
      const days = parseInt(val);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  const exportCSV = () => {
    if (filteredPosts.length === 0) return;
    const headers = [
      "Platform",
      "Profile",
      "Date",
      "Type",
      "Status",
      "Author",
      "Reach",
      "Views",
      "Engagements",
      "Likes",
      "Comments",
      "Shares",
      "Link Clicks",
      "Link",
    ];
    const rows = filteredPosts.map((p) => [
      p.platform,
      getProfileName(p.profileId),
      new Date(p.postedAt).toLocaleDateString(),
      getCleanTypeString(p.postType),
      p.isBoosted ? "Boosted" : p.isPublished ? "Published" : "Unpublished",
      p.authorName || "Unknown",
      p.reach,
      p.views,
      p.likes + p.comments + p.shares + p.clicks,
      p.likes,
      p.comments,
      p.shares,
      p.clicks,
      p.permalink,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `post_insights_${startDate}_to_${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 flex-1">
          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[160px]">
            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
              Sources
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none font-semibold shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <option value="all">Viewing all</option>
              {profiles
                .filter((p) => selectedProfileIds.includes(p.profileId))
                .map((p) => (
                  <option key={p.profileId} value={p.profileId}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[160px]">
            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
              Post Types
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none font-semibold shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <option value="all">Viewing all</option>
              <option value="video">Video</option>
              <option value="photo">Photo</option>
              <option value="link">Link</option>
              <option value="text">Text Only</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[160px]">
            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
              Published Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none font-semibold shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <option value="all">Viewing all</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="boosted">Boosted</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 w-full sm:w-auto min-w-[160px]">
            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">
              Authors
            </label>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none font-semibold shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <option value="all">Viewing all</option>
              {uniqueAuthors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>

          {(sourceFilter !== "all" ||
            typeFilter !== "all" ||
            statusFilter !== "all" ||
            authorFilter !== "all") && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mt-5 ml-2"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 w-full xl:w-auto pt-2 xl:pt-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
          >
            <Download size={14} /> Export
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={preset}
              onChange={handlePresetChange}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>

            {preset === "custom" && (
              <div className="animate-in fade-in slide-in-from-left-2">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(s, e) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 outline-none shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium px-1">by</span>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            <LayoutGrid size={14} className="text-gray-400 dark:text-gray-500" />
            <select
              value={sortMetric}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none bg-transparent cursor-pointer"
            >
              <option value="date">Published Date</option>
              <option value="reach">Reach</option>
              <option value="engagementRate">
                Engagement Rate (per Reach)
              </option>
              <option value="engagements">Engagements</option>
              <option value="likes">Reactions (Likes)</option>
              <option value="comments">Comments</option>
              <option value="shares">Shares</option>
              <option value="clicks">Post Link Clicks</option>
              <option value="views">Video Views</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">
            {selectedPosts.length} of {filteredPosts.length.toLocaleString()}{" "}
            selected
          </span>
          {selectedPosts.length > 0 && (
            <button
              onClick={() => setSelectedPosts([])}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Clear Selected
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col gap-3 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500 dark:text-gray-400 font-medium">
            Fetching post insights...
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No posts found matching the selected filters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {currentPosts.map((post) => {
            const isSelected = selectedPosts.includes(post.postId);
            const totalEngagements =
              post.likes + post.comments + post.shares + post.clicks;
            const engRate =
              post.reach > 0
                ? ((totalEngagements / post.reach) * 100).toFixed(1)
                : "0.0";
            const isVideo =
              post.postType.includes("video") || post.postType === "REELS";

            return (
              <div
                key={post.postId}
                className={`flex flex-col bg-white dark:bg-gray-900 rounded-xl transition-all relative ${isSelected ? "border-[2px] border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900" : "border border-gray-200 dark:border-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-gray-300 dark:hover:border-gray-700"}`}
              >
                <div className="absolute top-3 right-3 z-10 bg-white dark:bg-gray-800 rounded-sm">
                  <button
                    onClick={() => toggleSelectPost(post.postId)}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center"
                  >
                    {isSelected ? (
                      <CheckSquare
                        size={18}
                        className="text-blue-500 fill-blue-50 dark:fill-blue-900"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Square size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>

                <div className="p-4 flex items-start gap-3">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs uppercase overflow-hidden border border-gray-300 dark:border-gray-600">
                      {getProfileName(post.profileId).substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-[1px] shadow-sm">
                      {post.platform === "facebook" ? (
                        <Facebook
                          size={12}
                          className="text-[#1877F2] fill-[#1877F2]"
                        />
                      ) : (
                        <Instagram size={12} className="text-[#E1306C]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p
                      className="text-sm font-bold text-gray-900 dark:text-white truncate"
                      title={getProfileName(post.profileId)}
                    >
                      {getProfileName(post.profileId)}
                    </p>
                    <a
                      href={post.permalink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block truncate"
                    >
                      {formatDateString(post.postedAt)}
                    </a>
                  </div>
                </div>

                <div className="px-4 flex-1 flex flex-col">
                  <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-3 mb-3 leading-relaxed">
                    {post.message || (
                      <span className="italic text-gray-400 dark:text-gray-500">
                        No text content
                      </span>
                    )}
                  </p>

                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden group mb-4 border border-gray-200 dark:border-gray-700">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt="Post preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm p-1.5 rounded flex items-center justify-center">
                      {getTypeIcon(post.postType)}
                    </div>
                  </div>

                  <div className="space-y-0 mt-auto text-[13px]">
                    {isVideo && (
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          Video Views
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {post.views.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                      <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                        Reach
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {post.reach.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Engagements
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {totalEngagements.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                        Likes / Comments / Shares
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white text-xs">
                        <span title="Likes">{post.likes.toLocaleString()}</span>
                        <span className="text-gray-300 dark:text-gray-600 font-normal">|</span>
                        <span title="Comments">
                          {post.comments.toLocaleString()}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600 font-normal">|</span>
                        <span title="Shares">
                          {post.shares.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Engagement Rate (per Reach)
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {engRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 mt-3 flex items-center justify-between text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-xl">
                  <div className="flex gap-1">
                    {!post.isPublished && (
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Unpublished
                      </span>
                    )}
                    {post.isBoosted && (
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Boosted
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Tag
                      size={16}
                      className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    />
                    <a
                      href={post.permalink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View Post"
                    >
                      <ExternalLink size={16} className="cursor-pointer" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {selectedPosts.length === currentPosts.length &&
                      currentPosts.length > 0 ? (
                        <CheckSquare size={16} className="text-blue-500" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">Date / Profile</th>
                  <th className="px-4 py-3">Post Content</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-right">Reach</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Engagements</th>
                  <th className="px-4 py-3 text-right">Likes</th>
                  <th className="px-4 py-3 text-right">Comments</th>
                  <th className="px-4 py-3 text-right">Shares</th>
                  <th className="px-4 py-3 text-right">Eng. Rate</th>
                  <th className="px-4 py-3 text-center">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentPosts.map((post) => {
                  const isSelected = selectedPosts.includes(post.postId);
                  const totalEngagements =
                    post.likes + post.comments + post.shares + post.clicks;
                  const engRate =
                    post.reach > 0
                      ? ((totalEngagements / post.reach) * 100).toFixed(1)
                      : "0.0";
                  const isVideo =
                    post.postType.includes("video") ||
                    post.postType === "REELS";

                  return (
                    <tr
                      key={post.postId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleSelectPost(post.postId)}
                          className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-blue-500" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white text-[13px]">
                          {formatDateString(post.postedAt)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-gray-500 dark:text-gray-400 text-xs">
                          {post.platform === "facebook" ? (
                            <Facebook size={12} className="text-[#1877F2]" />
                          ) : (
                            <Instagram size={12} className="text-[#E1306C]" />
                          )}
                          <span className="truncate w-32 block">
                            {getProfileName(post.profileId)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 w-64">
                          {post.thumbnailUrl ? (
                            <img
                              src={post.thumbnailUrl}
                              className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 flex-shrink-0">
                              <ImageIcon size={16} />
                            </div>
                          )}
                          <p
                            className="truncate text-xs text-gray-700 dark:text-gray-300"
                            title={post.message}
                          >
                            {post.message || (
                              <span className="italic text-gray-400 dark:text-gray-500">
                                No text content
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-semibold">
                          {getCleanTypeString(post.postType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {post.reach.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {isVideo ? post.views.toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {totalEngagements.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                        {post.likes.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                        {post.comments.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                        {post.shares.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {engRate}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={post.permalink || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mt-6">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3 sm:mb-0">
            Showing{" "}
            <span className="text-gray-900 dark:text-white font-bold">{startIndex + 1}</span> to{" "}
            <span className="text-gray-900 dark:text-white font-bold">
              {Math.min(startIndex + postsPerPage, filteredPosts.length)}
            </span>{" "}
            of{" "}
            <span className="text-gray-900 dark:text-white font-bold">
              {filteredPosts.length.toLocaleString()}
            </span>{" "}
            posts
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-white px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
