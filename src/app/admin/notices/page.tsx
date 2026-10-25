"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentInput, RecentTextarea, saveRecentItem } from "@/components/ui/RecentInput";
import { Bell, PlusCircle, Pin, RefreshCw, Calendar, Users } from "lucide-react";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create notice modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("all");
  const [isPinned, setIsPinned] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notices");
      const data = await res.json();
      if (data.notices) setNotices(data.notices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg("");

    try {
      if (title) saveRecentItem("notice_title", title);
      if (content) saveRecentItem("notice_content", content);

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, audience, isPinned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish notice");

      setSaveMsg(data.message);
      setTimeout(() => {
        setIsModalOpen(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
        fetchNotices();
      }, 1000);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <AdminLayout title="Broadcast Notices & Announcements">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Community Notices & Bulletins
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish announcements for rent payment deadlines, Wi-Fi maintenance, food menu updates, and house rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotices}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Publish New Notice
            </button>
          </div>
        </div>

        {/* Notices Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.length === 0 ? (
            <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No notices published yet. Click &quot;Publish New Notice&quot; above.
            </div>
          ) : (
            notices.map((n) => (
              <div
                key={n._id}
                className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                  n.isPinned
                    ? "border-amber-300 ring-1 ring-amber-200 bg-amber-50/20"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{n.title}</h3>
                    {n.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                        <Pin className="w-3 h-3 text-amber-600" /> Pinned
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                    {n.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize font-medium text-slate-600">
                    Audience: {n.audience.replace(/_/g, " ")}
                  </span>
                  <span>{new Date(n.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Notice Modal */}
        {isModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
            title="Publish Broadcast Announcement"
          >
            {saveMsg && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">{saveMsg}</div>
            )}
            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Notice Title *
                </label>
                <RecentInput
                  storageKey="notice_title"
                  placeholder="e.g. Wi-Fi Router Upgrades on Sunday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 capitalize"
                >
                  <option value="all">All Residents (Entire Building)</option>
                  <option value="floor_1">Floor 1 Residents</option>
                  <option value="floor_2">Floor 2 Residents</option>
                  <option value="floor_3">Floor 3 Residents</option>
                  <option value="floor_4">Floor 4 Residents</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Notice Content *
                </label>
                <RecentTextarea
                  storageKey="notice_content"
                  rows={4}
                  placeholder="Full message or instructions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="pin" className="text-slate-700 font-semibold cursor-pointer">
                  Pin this notice to the top of resident bulletin boards
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {saveLoading ? "Publishing..." : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
