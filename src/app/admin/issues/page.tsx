"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentTextarea, saveRecentItem } from "@/components/ui/RecentInput";
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  User,
  Bed,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Manage Issue Modal state
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("open");
  const [newPriority, setNewPriority] = useState("medium");
  const [adminNotes, setAdminNotes] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(`/api/issues?${params.toString()}`);
      const data = await res.json();
      if (data.issues) setIssues(data.issues);
      if (data.summary) setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, categoryFilter]);

  const handleOpenManage = (issue: any) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setNewPriority(issue.priority);
    setAdminNotes(issue.adminNotes || "");
    setUpdateMsg("");
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setUpdateLoading(true);
    setUpdateMsg("");

    try {
      if (adminNotes) saveRecentItem("issue_admin_notes", adminNotes);

      const res = await fetch(`/api/issues/${selectedIssue._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          priority: newPriority,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setUpdateMsg(data.message);
      setTimeout(() => {
        setSelectedIssue(null);
        fetchIssues();
      }, 1000);
    } catch (err: any) {
      setUpdateMsg(`Error: ${err.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <AdminLayout title="Maintenance & Issues Hub">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Maintenance Tickets & Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track, triage, and resolve plumbing, electrical, cleaning, and room requests.
            </p>
          </div>

          <button
            onClick={fetchIssues}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </button>
        </div>

        {/* Summary Metric Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Tickets</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{summary.total}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-sm bg-rose-50/20">
              <span className="text-[11px] font-semibold text-rose-700 uppercase">Open</span>
              <p className="text-xl font-black text-rose-800 mt-0.5">{summary.open}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-sm bg-indigo-50/20">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase">In Progress</span>
              <p className="text-xl font-black text-indigo-800 mt-0.5">{summary.workingOnIt}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm bg-emerald-50/20">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Resolved</span>
              <p className="text-xl font-black text-emerald-800 mt-0.5">{summary.resolved}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="working_on_it">Working on it</option>
            <option value="waiting_for_resident">Waiting for resident</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 capitalize"
          >
            <option value="all">All Categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electricity">Electricity</option>
            <option value="cleaning">Cleaning</option>
            <option value="wifi">Wi-Fi</option>
            <option value="furniture">Furniture</option>
            <option value="room_maintenance">Room Maintenance</option>
            <option value="water_supply">Water Supply</option>
            <option value="security">Security</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Issues List */}
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No maintenance issues found for the selected criteria.
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{issue.title}</span>
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
                    <span
                      className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                        issue.priority === "urgent" || issue.priority === "high"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {issue.priority} Priority
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{issue.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <strong className="text-slate-700">{issue.residentId?.name}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                      <Bed className="w-3.5 h-3.5" /> Room {issue.roomNumber}
                      {issue.bedNumber && ` (${issue.bedNumber})`}
                    </span>
                    <span className="capitalize">Category: {issue.category.replace(/_/g, " ")}</span>
                    <span>
                      Reported: {new Date(issue.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  {issue.adminNotes && (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600">
                      <strong className="text-slate-800">Admin Notes: </strong>
                      {issue.adminNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenManage(issue)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    Manage Ticket
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Manage Issue Modal */}
        {selectedIssue && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedIssue(null)}
            title={`Manage Ticket: ${selectedIssue.title}`}
          >
            {updateMsg && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">
                {updateMsg}
              </div>
            )}

            <form onSubmit={handleUpdateIssue} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Reported by
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedIssue.residentId?.name} (+91 {selectedIssue.residentId?.mobile})
                </span>
                <p className="text-slate-600 mt-1">{selectedIssue.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="open">Open</option>
                    <option value="working_on_it">Working on it (In Progress)</option>
                    <option value="waiting_for_resident">Waiting for resident</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Manager Notes & Resident Response
                </label>
                <RecentTextarea
                  storageKey="issue_admin_notes"
                  rows={3}
                  placeholder="e.g. Plumber dispatched today at 3:00 PM; replacement washer installed."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {updateLoading ? "Saving..." : "Save Updates"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
