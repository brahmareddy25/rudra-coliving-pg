"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Building,
  Bed,
  Calendar,
  CreditCard,
  Wrench,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Ban,
  KeyRound,
  AlertTriangle,
  ExternalLink,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { RecentTextarea, saveRecentItem } from "@/components/ui/RecentInput";
import { clsx } from "clsx";

export default function ResidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const residentId = params?.id as string;

  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "allocation" | "payments" | "issues" | "docs">("info");

  // Approval modal states
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "request_resubmission" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // OTP Management states
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");

  const handleToggleOtp = async (currentlyBlocked: boolean) => {
    setOtpLoading(true);
    setOtpMessage("");
    setOtpError("");
    try {
      const action = currentlyBlocked ? "start" : "stop";
      const res = await fetch(`/api/residents/${residentId}/otp-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update OTP status");
      setOtpMessage(data.message);
      setResident((prev: any) => ({
        ...prev,
        otpBlocked: !currentlyBlocked,
        failedOtpAttempts: currentlyBlocked ? 0 : prev.failedOtpAttempts,
        otpBlockedReason: currentlyBlocked ? undefined : "Stopped manually by Property Admin",
        otpBlockedAt: currentlyBlocked ? undefined : new Date().toISOString(),
      }));
    } catch (err: any) {
      setOtpError(err.message || "Failed to update OTP status");
    } finally {
      setOtpLoading(false);
    }
  };

  const fetchResident = async () => {
    if (!residentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/residents/${residentId}`);
      const data = await res.json();
      if (data.resident) setResident(data.resident);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResident();
  }, [residentId]);

  const handleApprovalSubmit = async () => {
    if (!approvalAction) return;
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/residents/${residentId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: approvalAction,
          reason: actionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (actionReason) saveRecentItem("admin_resident_verification_feedback", actionReason);

      setActionSuccess(data.message);
      setTimeout(() => {
        setApprovalAction(null);
        fetchResident();
      }, 1200);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !resident) {
    return (
      <AdminLayout title="Resident Profile">
        <div className="py-20 text-center text-slate-400">Loading resident profile...</div>
      </AdminLayout>
    );
  }

  const profile = resident.profile || {};
  const documents = resident.documents || {};

  return (
    <AdminLayout title={`Resident: ${resident.name}`}>
      <div className="space-y-6">
        {/* Back navigation */}
        <Link
          href="/admin/residents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Resident Directory
        </Link>

        {/* Profile Header Hero Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center border-2 border-emerald-300 shrink-0">
              {resident.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{resident.name}</h2>
                <Badge
                  variant={
                    documents.verificationStatus === "approved"
                      ? "paid"
                      : documents.verificationStatus === "pending_review"
                      ? "pending"
                      : documents.verificationStatus === "rejected"
                      ? "overdue"
                      : "default"
                  }
                >
                  {documents.verificationStatus.replace(/_/g, " ")}
                </Badge>

                {resident.otpBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    OTP Stopped {resident.failedOtpAttempts ? `(${resident.failedOtpAttempts} fails)` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    OTP Active {resident.failedOtpAttempts ? `(${resident.failedOtpAttempts}/3)` : ""}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> +91 {resident.mobile}
                </span>
                {resident.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {resident.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {profile.occupation}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {resident.otpBlocked ? (
              <button
                onClick={() => handleToggleOtp(true)}
                disabled={otpLoading}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" /> {otpLoading ? "Starting..." : "Start OTP Service"}
              </button>
            ) : (
              <button
                onClick={() => handleToggleOtp(false)}
                disabled={otpLoading}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Ban className="w-4 h-4 text-rose-600" /> {otpLoading ? "Stopping..." : "Stop OTP Service"}
              </button>
            )}

            {documents.verificationStatus !== "approved" && (
              <button
                onClick={() => setApprovalAction("approve")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Resident
              </button>
            )}
            <button
              onClick={() => setApprovalAction("request_resubmission")}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Request Resubmission
            </button>
          </div>
        </div>

        {/* OTP Status Feedback Alert */}
        {otpMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{otpMessage}</span>
          </div>
        )}
        {otpError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { key: "info", label: "Personal Information", icon: User },
            { key: "allocation", label: "Room & Bed History", icon: Bed },
            { key: "payments", label: "Rent & Payments", icon: CreditCard },
            { key: "issues", label: `Issues (${resident.issues?.length || 0})`, icon: Wrench },
            { key: "docs", label: "ID Verification Documents", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={clsx(
                  "px-4 py-3 border-b-2 font-medium flex items-center gap-2 transition-all whitespace-nowrap",
                  isCurrent
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Personal Info */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personal & Demographic Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Gender</span>
                  <span className="font-semibold text-slate-900 capitalize">{profile.gender || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Birth / Age</span>
                  <span className="font-semibold text-slate-900">
                    {profile.dob ? new Date(profile.dob).toLocaleDateString("en-IN") : "N/A"}{" "}
                    ({profile.age || 0} years)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Occupation</span>
                  <span className="font-semibold text-slate-900">{profile.occupation || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Company / University</span>
                  <span className="font-semibold text-slate-900">{profile.companyName || "N/A"}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 block mb-1">Permanent Residential Address</span>
                <p className="font-semibold text-slate-900 leading-relaxed">
                  {profile.permanentAddress || "N/A"}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Emergency Contact Details
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Contact Name</span>
                  <span className="font-semibold text-slate-900">
                    {profile.emergencyContact?.name || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Contact Phone</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {profile.emergencyContact?.phone || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Relationship</span>
                  <span className="font-semibold text-slate-900">
                    {profile.emergencyContact?.relationship || "Not provided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Security & OTP Access Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" /> Security & OTP Service Status
                </h3>
                {resident.otpBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    Service Stopped / Blocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Service Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">OTP Service State</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {resident.otpBlocked ? "Suspended (Locked Out)" : "Normal / Active"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Failed OTP Attempts</span>
                  <span className={clsx("font-bold text-slate-900 mt-0.5 block", (resident.failedOtpAttempts || 0) > 0 && "text-amber-600")}>
                    {resident.failedOtpAttempts || 0} / 3 maximum attempts
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Status Details</span>
                  <span className="font-medium text-slate-700 mt-0.5 block truncate">
                    {resident.otpBlockedReason || "All systems normal"}
                  </span>
                </div>
              </div>

              {resident.otpBlocked && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    OTP Service Currently Stopped
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This resident entered invalid OTP codes more than 3 times or was suspended by management. They cannot request or verify password reset OTPs until restarted.
                  </p>
                  {resident.otpBlockedAt && (
                    <span className="block mt-1 text-[10px] text-rose-600 font-mono">
                      Locked at: {new Date(resident.otpBlockedAt).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {resident.otpBlocked ? (
                  <button
                    onClick={() => handleToggleOtp(true)}
                    disabled={otpLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" /> Start OTP Service & Reset Counter
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleOtp(false)}
                    disabled={otpLoading}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4 text-rose-600" /> Stop OTP Service Manually
                  </button>
                )}
                <span className="text-[11px] text-slate-400">
                  {resident.otpBlocked
                    ? "Clicking Start OTP will clear the lockout and reset failed attempts to 0."
                    : "Stopping OTP prevents the resident from receiving or verifying SMS OTPs."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Allocation History */}
        {activeTab === "allocation" && (
          <div className="space-y-6">
            {resident.assignedBed ? (
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Active Bed Assignment
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Bed {resident.assignedBed.bedNumber}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Room {resident.assignedBed.roomNumber} · Floor {resident.assignedBed.floorNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-700">
                      ₹{resident.assignedBed.monthlyRent.toLocaleString("en-IN")}/mo
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-500">
                Resident has no active bed assignment. Go to{" "}
                <Link href="/admin/beds" className="text-emerald-600 font-bold hover:underline">
                  Floor & Beds
                </Link>{" "}
                to assign an available bed.
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-700">
                Historical Allocations
              </div>
              <div className="p-4 divide-y divide-slate-100 text-xs">
                {resident.allocationHistory?.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No allocation history recorded.</p>
                ) : (
                  resident.allocationHistory?.map((alloc: any) => (
                    <div key={alloc._id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">
                          Bed {alloc.bedId?.bedNumber || "N/A"}
                        </span>
                        <span className="text-slate-500 ml-2">
                          From: {new Date(alloc.startDate).toLocaleDateString("en-IN")}
                          {alloc.endDate && ` To: ${new Date(alloc.endDate).toLocaleDateString("en-IN")}`}
                        </span>
                        {alloc.notes && <p className="text-[11px] text-slate-400 mt-0.5">{alloc.notes}</p>}
                      </div>
                      <Badge variant={alloc.status === "active" ? "occupied" : "default"}>
                        {alloc.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payments */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-700">
                Rent Dues Ledger
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Billing Month</th>
                      <th className="py-2.5 px-4">Amount Due</th>
                      <th className="py-2.5 px-4">Amount Paid</th>
                      <th className="py-2.5 px-4">Balance</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resident.rentDues?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">
                          No rent dues found.
                        </td>
                      </tr>
                    ) : (
                      resident.rentDues?.map((due: any) => (
                        <tr key={due._id}>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{due.billingMonth}</td>
                          <td className="py-2.5 px-4">₹{due.rentAmount.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-4 text-emerald-700 font-semibold">
                            ₹{due.totalPaidAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-4 text-rose-700 font-semibold">
                            ₹{due.balanceAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-4">
                            <Badge
                              variant={
                                due.dueStatus === "paid"
                                  ? "paid"
                                  : due.dueStatus === "partially_paid"
                                  ? "partially_paid"
                                  : "pending"
                              }
                            >
                              {due.dueStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-700">
                Payment Transactions
              </div>
              <div className="p-4 divide-y divide-slate-100 text-xs">
                {resident.payments?.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No payment submissions recorded.</p>
                ) : (
                  resident.payments?.map((p: any) => (
                    <div key={p._id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-slate-500 ml-2 font-mono">Ref: {p.transactionRef}</span>
                        <span className="text-slate-400 ml-2 uppercase text-[10px]">({p.paymentMethod})</span>
                        <p className="text-[11px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          p.status === "verified"
                            ? "paid"
                            : p.status === "rejected"
                            ? "overdue"
                            : "pending"
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Issues */}
        {activeTab === "issues" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 divide-y divide-slate-100 text-xs">
            {resident.issues?.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No maintenance issues raised by resident.</p>
            ) : (
              resident.issues?.map((issue: any) => (
                <div key={issue._id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
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
                  </div>
                  <p className="text-slate-600">{issue.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Category: {issue.category}</span>
                    <span>Priority: {issue.priority}</span>
                    <span>Reported: {new Date(issue.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Documents */}
        {activeTab === "docs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aadhaar preview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Aadhaar Document Copy
                </h4>
                {documents.aadhaarViewUrl && (
                  <a
                    href={documents.aadhaarViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    Open Full Document <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {documents.aadhaarViewUrl ? (
                <div className="h-64 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center relative">
                  <iframe
                    src={documents.aadhaarViewUrl}
                    className="w-full h-full"
                    title="Aadhaar Preview"
                  />
                </div>
              ) : (
                <div className="h-48 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400">
                  No Aadhaar document uploaded yet
                </div>
              )}
            </div>

            {/* Passport Photo */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Passport-Size Photograph
                </h4>
                {documents.photoViewUrl && (
                  <a
                    href={documents.photoViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    Open Image <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {documents.photoViewUrl ? (
                <div className="h-64 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-2">
                  <img
                    src={documents.photoViewUrl}
                    alt="Resident Photo"
                    className="h-full object-contain rounded"
                  />
                </div>
              ) : (
                <div className="h-48 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400">
                  No photograph uploaded yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval / Action Modal */}
        {approvalAction && (
          <Modal
            isOpen={true}
            onClose={() => setApprovalAction(null)}
            title={
              approvalAction === "approve"
                ? `Approve ${resident.name}`
                : approvalAction === "reject"
                ? `Reject Documents for ${resident.name}`
                : `Request Resubmission from ${resident.name}`
            }
          >
            {actionError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                {approvalAction === "approve"
                  ? "Approving will verify the resident's documents, activate their portal account, and allow bed allocation."
                  : "Please specify instructions or reason for document rejection/resubmission."}
              </p>

              {approvalAction !== "approve" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Feedback / Rejection Reason *
                  </label>
                  <RecentTextarea
                    storageKey="admin_resident_verification_feedback"
                    rows={3}
                    placeholder="e.g. Aadhaar image is blurry or expired. Please upload a clear color scan."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalAction(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprovalSubmit}
                  disabled={actionLoading}
                  className={clsx(
                    "px-4 py-2 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50",
                    approvalAction === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  {actionLoading ? "Processing..." : "Confirm Action"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
