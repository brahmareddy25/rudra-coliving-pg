"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentTextarea, saveRecentItem } from "@/components/ui/RecentInput";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  RefreshCw,
  Phone,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function ApprovalsQueuePage() {
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "resubmit" | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/residents?approval=pending");
      const data = await res.json();
      if (data.residents) setResidents(data.residents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (resident: any, type: "approve" | "reject" | "resubmit") => {
    setSelectedResident(resident);
    setActionType(type);
    setReason("");
    setMessage("");
  };

  const submitAction = async () => {
    if (!selectedResident || !actionType) return;
    setActionLoading(true);

    const apiAction = actionType === "resubmit" ? "request_resubmission" : actionType;

    try {
      const res = await fetch(`/api/residents/${selectedResident.id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: apiAction, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (reason) saveRecentItem("admin_resident_verification_feedback", reason);

      setMessage(data.message);
      setTimeout(() => {
        setActionType(null);
        setSelectedResident(null);
        fetchQueue();
      }, 1000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title="Document Verification Queue">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Resident Identity Approvals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review submitted Aadhaar cards and photographs before activating resident accounts.
            </p>
          </div>

          <button
            onClick={fetchQueue}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
        </div>

        {residents.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no pending identity documents awaiting review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {residents.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{r.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">+91 {r.mobile}</p>
                    </div>
                    <Badge variant="pending">Pending Review</Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400">Email (OTP): </span>
                      <span className="font-semibold text-emerald-700 font-mono">{r.email || "Pending"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Gender & Age: </span>
                      <span className="font-semibold capitalize">{r.gender || "N/A"} · {r.age || 0} yrs</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Occupation: </span>
                      <span className="font-semibold">{r.occupation || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Company / College: </span>
                      <span className="font-semibold">{r.companyName || "N/A"}</span>
                    </div>
                    {r.permanentAddress && (
                      <div>
                        <span className="text-slate-400">Native Address: </span>
                        <span className="font-medium text-slate-800 line-clamp-1">{r.permanentAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <Link
                    href={`/admin/residents/${r.id}`}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect Documents & Profile
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAction(r, "approve")}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(r, "reject")}
                      className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Confirmation Modal */}
        {actionType && selectedResident && (
          <Modal
            isOpen={true}
            onClose={() => setActionType(null)}
            title={
              actionType === "approve"
                ? `Approve ${selectedResident.name}`
                : actionType === "reject"
                ? `Reject Documents for ${selectedResident.name}`
                : `Request Resubmission`
            }
          >
            {message && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">
                {message}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                {actionType === "approve"
                  ? `Are you sure you want to approve ${selectedResident.name}? This will activate their account and allow bed allocation.`
                  : "Please provide reason or corrective action required for the resident:"}
              </p>

              {actionType !== "approve" && (
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Feedback / Rejection Reason *
                  </label>
                  <RecentTextarea
                    storageKey="admin_resident_verification_feedback"
                    rows={3}
                    placeholder="e.g. Aadhaar copy is cropped or unreadable."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAction}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white rounded-lg font-bold transition-colors ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
