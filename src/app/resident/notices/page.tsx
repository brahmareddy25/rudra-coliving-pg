"use client";

import React, { useState, useEffect } from "react";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import { Badge } from "@/components/ui/Badge";
import { Bell, Pin, Check, RefreshCw } from "lucide-react";

export default function ResidentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleMarkRead = async (noticeId: string) => {
    try {
      await fetch(`/api/notices/${noticeId}/read`, { method: "POST" });
      setNotices((prev) =>
        prev.map((n) => (n._id === noticeId ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ResidentLayout title="Notices & Announcements">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Community Notices & Bulletin Board
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stay informed on PG schedules, food menus, Wi-Fi maintenance, and house rules.
            </p>
          </div>

          <button
            onClick={fetchNotices}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {notices.length === 0 ? (
            <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No notices published at this time.
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      {n.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <Pin className="w-3 h-3 text-amber-600" /> Pinned
                        </span>
                      )}
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unread" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                    {n.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Posted: {new Date(n.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>

                  {!n.isRead ? (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark as read
                    </button>
                  ) : (
                    <span className="text-slate-400">Read ✓</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ResidentLayout>
  );
}
