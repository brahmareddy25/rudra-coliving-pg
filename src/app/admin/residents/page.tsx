"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Bed,
  ShieldCheck,
  ShieldAlert,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";

export default function ResidentsDirectoryPage() {
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [floor, setFloor] = useState("all");
  const [approval, setApproval] = useState("all");
  const [occupancy, setOccupancy] = useState("all");
  const [otpFilter, setOtpFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (floor !== "all") params.append("floor", floor);
      if (approval !== "all") params.append("approval", approval);
      if (occupancy !== "all") params.append("occupancy", occupancy);

      const res = await fetch(`/api/residents?${params.toString()}`);
      const data = await res.json();
      if (data.residents) setResidents(data.residents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOtp = async (residentId: string, currentlyBlocked: boolean) => {
    setTogglingId(residentId);
    try {
      const action = currentlyBlocked ? "start" : "stop";
      const res = await fetch(`/api/residents/${residentId}/otp-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update OTP status");

      setResidents((prev) =>
        prev.map((r) =>
          r.id === residentId
            ? {
                ...r,
                otpBlocked: !currentlyBlocked,
                failedOtpAttempts: currentlyBlocked ? 0 : r.failedOtpAttempts,
              }
            : r
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to update OTP status");
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [floor, approval, occupancy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search) saveRecentItem("admin_residents_search", search);
    fetchResidents();
  };

  return (
    <AdminLayout title="Resident Directory">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Resident Directory & Profiles
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Search, verify identity documents, and track room allocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchResidents}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
              Refresh
            </button>
            <Link
              href="/admin/approvals"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              Verification Queue →
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <RecentInput
              storageKey="admin_residents_search"
              type="text"
              placeholder="Search by name, mobile, occupation, or bed code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Floors</option>
              <option value="1">Floor 1 (101-106)</option>
              <option value="2">Floor 2 (201-206)</option>
              <option value="3">Floor 3 (301-306)</option>
              <option value="4">Floor 4 (401-406)</option>
            </select>

            <select
              value={approval}
              onChange={(e) => setApproval(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Approvals</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
              <option value="not_uploaded">Documents Missing</option>
            </select>

            <select
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Occupancy</option>
              <option value="allocated">Allocated Beds</option>
              <option value="unallocated">Unallocated</option>
            </select>

            <select
              value={otpFilter}
              onChange={(e) => setOtpFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All OTP Services</option>
              <option value="active">OTP Active</option>
              <option value="stopped">OTP Stopped / Blocked</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Assigned Bed</th>
                  <th className="py-3 px-4">ID Verification</th>
                  <th className="py-3 px-4">OTP Service</th>
                  <th className="py-3 px-4">Current Rent</th>
                  <th className="py-3 px-4">Move-in</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Loading residents...
                    </td>
                  </tr>
                ) : residents.filter((r) => {
                    if (otpFilter === "active") return !r.otpBlocked;
                    if (otpFilter === "stopped") return r.otpBlocked;
                    return true;
                  }).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No matching resident records found.
                    </td>
                  </tr>
                ) : (
                  residents
                    .filter((r) => {
                      if (otpFilter === "active") return !r.otpBlocked;
                      if (otpFilter === "stopped") return r.otpBlocked;
                      return true;
                    })
                    .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200 shrink-0">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{r.name}</span>
                            <span className="text-[11px] text-slate-400">{r.occupation || "Resident"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        +91 {r.mobile}
                      </td>

                      <td className="py-3 px-4">
                        {r.assignedBed ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
                            <Bed className="w-3.5 h-3.5" />
                            {r.assignedBed.bedNumber} (Rm {r.assignedBed.roomNumber})
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            r.idVerificationStatus === "approved"
                              ? "paid"
                              : r.idVerificationStatus === "pending_review"
                              ? "pending"
                              : r.idVerificationStatus === "rejected"
                              ? "overdue"
                              : "default"
                          }
                        >
                          {r.idVerificationStatus.replace(/_/g, " ")}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {r.otpBlocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                              <Ban className="w-3 h-3 text-rose-600" />
                              Stopped {r.failedOtpAttempts ? `(${r.failedOtpAttempts} fails)` : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Active {r.failedOtpAttempts ? `(${r.failedOtpAttempts}/3)` : ""}
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleOtp(r.id, r.otpBlocked)}
                            disabled={togglingId === r.id}
                            title={r.otpBlocked ? "Start OTP Service for this resident" : "Stop OTP Service for this resident"}
                            className={clsx(
                              "px-2 py-1 rounded text-[10px] font-bold transition-all border whitespace-nowrap",
                              r.otpBlocked
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                            )}
                          >
                            {togglingId === r.id ? "..." : r.otpBlocked ? "Start OTP" : "Stop OTP"}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {r.currentRentDue ? (
                          <span
                            className={clsx(
                              "font-semibold text-[11px]",
                              r.currentRentDue.dueStatus === "paid"
                                ? "text-emerald-700"
                                : r.currentRentDue.dueStatus === "partially_paid"
                                ? "text-sky-700"
                                : "text-amber-700"
                            )}
                          >
                            ₹{r.currentRentDue.rentAmount.toLocaleString("en-IN")}{" "}
                            ({r.currentRentDue.dueStatus})
                          </span>
                        ) : (
                          <span className="text-slate-400">No active due</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {r.moveInDate
                          ? new Date(r.moveInDate).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/residents/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          Profile <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
