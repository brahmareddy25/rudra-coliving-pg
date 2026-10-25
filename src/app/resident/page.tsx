"use client";

import React, { useState, useEffect } from "react";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import { Badge } from "@/components/ui/Badge";
import {
  Bed,
  CreditCard,
  Wrench,
  Bell,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ResidentDashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [latestDue, setLatestDue] = useState<any>(null);
  const [openIssues, setOpenIssues] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/payments/dues").then((r) => r.json()),
      fetch("/api/issues").then((r) => r.json()),
      fetch("/api/notices").then((r) => r.json()),
    ])
      .then(([auth, dues, issues, notifs]) => {
        if (auth.user) setUserData(auth.user);
        if (dues.dues && dues.dues.length > 0) setLatestDue(dues.dues[0]);
        if (issues.issues) setOpenIssues(issues.issues.filter((i: any) => i.status !== "resolved" && i.status !== "closed"));
        if (notifs.notices) setNotices(notifs.notices.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const assignedBed = userData?.assignedBed;
  const profile = userData?.profile;

  return (
    <ResidentLayout title="Resident Dashboard">
      <div className="space-y-6">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Welcome Home
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Hello, {userData?.name || "Resident"}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Welcome to Rudra Co-Living. Live comfortably, connect with fellow residents, and manage your stay with ease.
            </p>
          </div>
        </div>

        {/* Assigned Room & Rent Due Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Room Assignment
                </span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Bed className="w-5 h-5" />
                </span>
              </div>

              {assignedBed ? (
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Bed {assignedBed.bedNumber}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Room {assignedBed.roomNumber} · Floor {assignedBed.floorNumber}
                  </p>
                  <p className="text-xs text-emerald-700 font-bold mt-2">
                    Monthly Rent: ₹{assignedBed.monthlyRent.toLocaleString("en-IN")}/mo
                  </p>
                </div>
              ) : (
                <div className="py-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Bed Allocation Pending</p>
                  <p className="mt-1">
                    Management is assigning your preferred room. You will receive an instant notification once allocated.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                href="/resident/room"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View Room Details & Roommates <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Current Rent Due Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monthly Rent Dues
                </span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </span>
              </div>

              {latestDue ? (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{latestDue.balanceAmount.toLocaleString("en-IN")}
                    </span>
                    <Badge
                      variant={
                        latestDue.dueStatus === "paid"
                          ? "paid"
                          : latestDue.dueStatus === "partially_paid"
                          ? "partially_paid"
                          : "pending"
                      }
                    >
                      {latestDue.dueStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Billing Cycle: {latestDue.billingMonth} · Due by{" "}
                    {new Date(latestDue.dueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ) : (
                <div className="py-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">All Dues Cleared 🎉</p>
                  <p className="mt-1">No outstanding balance for the current billing cycle.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
              <Link
                href="/resident/payments"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Pay Now / Upload Proof
              </Link>
              <Link
                href="/resident/payments"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Payment Receipts →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Action Hub */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/resident/issues"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Raise Issue</span>
            <span className="text-[10px] text-slate-400">Maintenance & repairs</span>
          </Link>

          <Link
            href="/resident/payments"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Pay Rent</span>
            <span className="text-[10px] text-slate-400">UPI / Bank transfer</span>
          </Link>

          <Link
            href="/resident/messages"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Chat with Admin</span>
            <span className="text-[10px] text-slate-400">Direct inquiries</span>
          </Link>

          <Link
            href="/resident/profile"
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">My Profile</span>
            <span className="text-[10px] text-slate-400">Aadhaar & settings</span>
          </Link>
        </div>

        {/* Notices & Open Issues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latest Announcements */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" /> Property Notices
              </h3>
              <Link href="/resident/notices" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {notices.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No active notices.</p>
              ) : (
                notices.map((n) => (
                  <div key={n._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                    <p className="text-slate-600 line-clamp-2 mt-0.5">{n.content}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Open Issues */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-500" /> Active Maintenance Requests
              </h3>
              <Link href="/resident/issues" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">
                Submit New →
              </Link>
            </div>

            <div className="space-y-3">
              {openIssues.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  No open issues reported. Everything is running smoothly!
                </div>
              ) : (
                openIssues.map((issue) => (
                  <div key={issue._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{issue.title}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Category: {issue.category}</p>
                    </div>
                    <Badge variant={issue.status === "working_on_it" ? "working_on_it" : "open"}>
                      {issue.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ResidentLayout>
  );
}
