"use client";

import React, { useState, useEffect } from "react";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentInput, RecentTextarea, saveRecentItem } from "@/components/ui/RecentInput";
import {
  Wrench,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Send,
  Bed,
} from "lucide-react";
import { clsx } from "clsx";

export default function ResidentIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New issue modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("plumbing");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  // Follow-up reply state
  const [replyingIssueId, setReplyingIssueId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/issues");
      const data = await res.json();
      if (data.issues) setIssues(data.issues);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitMsg("");

    try {
      if (title) saveRecentItem("issue_title", title);
      if (description) saveRecentItem("issue_description", description);

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, priority, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitMsg("Issue submitted successfully. Maintenance team notified.");
      setTimeout(() => {
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        fetchIssues();
      }, 1000);
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSendReply = async (issueId: string) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentReply: replyText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply");

      setReplyingIssueId(null);
      setReplyText("");
      fetchIssues();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <ResidentLayout title="Maintenance & Service Requests">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Maintenance Requests & Support
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Report plumbing, electrical, cleaning, or room repairs. Track real-time progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchIssues}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            </button>
            <button
              onClick={() => {
                setSubmitMsg("");
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Report New Issue
            </button>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {issues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-base">No Open Issues</h3>
              <p className="text-xs text-slate-400 mt-1">
                You haven&apos;t reported any active maintenance requests. Everything is in order!
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-slate-900 text-sm">{issue.title}</h3>
                    <Badge
                      variant={
                        issue.status === "resolved"
                          ? "resolved"
                          : issue.status === "working_on_it"
                          ? "working_on_it"
                          : "open"
                      }
                    >
                      {issue.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Reported on {new Date(issue.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{issue.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span>
                    Category: <strong className="text-slate-800 capitalize">{issue.category.replace(/_/g, " ")}</strong>
                  </span>
                  <span>
                    Priority: <strong className="text-slate-800 uppercase">{issue.priority}</strong>
                  </span>
                  <span>
                    Location: <strong className="text-blue-800">Room {issue.roomNumber} ({issue.bedNumber || "Allocated Bed"})</strong>
                  </span>
                </div>

                {/* Manager Resolution / Notes */}
                {issue.adminNotes && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                    <span className="font-bold text-emerald-800 block mb-0.5">
                      💬 Property Manager Response:
                    </span>
                    <p>{issue.adminNotes}</p>
                  </div>
                )}

                {/* Resident Follow-up Reply */}
                {issue.residentReply && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950">
                    <span className="font-bold text-blue-800 block mb-0.5">
                      You replied:
                    </span>
                    <p>{issue.residentReply}</p>
                  </div>
                )}

                {/* Reply action toggle */}
                {issue.status !== "resolved" && issue.status !== "closed" && (
                  <div className="pt-2 flex justify-end">
                    {replyingIssueId === issue._id ? (
                      <div className="w-full space-y-2">
                        <textarea
                          rows={2}
                          placeholder="Type your follow-up note or confirmation..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setReplyingIssueId(null)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendReply(issue._id)}
                            disabled={replyLoading}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            {replyLoading ? "Sending..." : "Submit Note"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingIssueId(issue._id);
                          setReplyText("");
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Add Follow-up Note
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Report New Issue Modal */}
        {isModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
            title="Report Maintenance Issue"
            description="Our facilities team will be immediately notified to attend to your request."
          >
            {submitMsg && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">{submitMsg}</div>
            )}
            <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Issue Summary *
                </label>
                <RecentInput
                  storageKey="issue_title"
                  placeholder="e.g. Bathroom shower water pressure is low"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 capitalize"
                  >
                    <option value="plumbing">Plumbing / Water</option>
                    <option value="electricity">Electrical / Geyser / Fan</option>
                    <option value="cleaning">Housekeeping / Room Cleaning</option>
                    <option value="wifi">Wi-Fi / Internet</option>
                    <option value="furniture">Furniture / Bed / Wardrobe</option>
                    <option value="room_maintenance">Door / Window Maintenance</option>
                    <option value="water_supply">Water Supply</option>
                    <option value="security">Security / Lock</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="low">Low (General routine)</option>
                    <option value="medium">Medium (Regular attention)</option>
                    <option value="high">High (Needs fast fix)</option>
                    <option value="urgent">Urgent (Requires immediate dispatch)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Description of Problem *
                </label>
                <RecentTextarea
                  storageKey="issue_description"
                  rows={3}
                  placeholder="Please describe what is happening and the best time for technician entry..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
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
                  disabled={submitLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {submitLoading ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </ResidentLayout>
  );
}
