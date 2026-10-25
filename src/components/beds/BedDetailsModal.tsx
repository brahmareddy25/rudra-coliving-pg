"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { BedData } from "./BedTile";
import {
  User,
  Calendar,
  ShieldCheck,
  ArrowRight,
  UserMinus,
  AlertTriangle,
  Key,
  Copy,
  Check,
  Phone,
  UserPlus,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";

interface ResidentOption {
  id: string;
  name: string;
  mobile: string;
  status: string;
  idVerificationStatus: string;
  assignedBed: any;
}

interface BedDetailsModalProps {
  bed: BedData | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function BedDetailsModal({ bed, isOpen, onClose, onRefresh }: BedDetailsModalProps) {
  const [allocationMode, setAllocationMode] = useState<"new" | "existing">("new");
  const [newResidentName, setNewResidentName] = useState("");
  const [newResidentMobile, setNewResidentMobile] = useState("");
  const [approvedResidents, setApprovedResidents] = useState<ResidentOption[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthlyRent, setMonthlyRent] = useState(bed?.monthlyRent || 8500);
  const [notes, setNotes] = useState("");
  const [moveOutNotes, setMoveOutNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Credentials card after new resident allocation
  const [credentials, setCredentials] = useState<{
    name: string;
    mobile: string;
    tempPassword: string;
    bedNumber: string;
    roomNumber: string | number;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  useEffect(() => {
    if (bed) {
      setMonthlyRent(bed.monthlyRent);
      setError("");
      setSuccess("");
      setCredentials(null);
      setNewResidentName("");
      setNewResidentMobile("");
      setNotes("");
    }
  }, [bed, isOpen]);

  // Fetch approved residents who do not have an active bed allocation (for existing mode)
  useEffect(() => {
    if (isOpen && bed?.status === "available") {
      fetch("/api/residents?approval=approved&occupancy=unallocated")
        .then((res) => res.json())
        .then((data) => {
          if (data.residents) {
            setApprovedResidents(data.residents);
            if (data.residents.length > 0) {
              setSelectedResidentId(data.residents[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen, bed?.status]);

  if (!bed) return null;

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        bedId: bed._id,
        startDate,
        monthlyRent,
        notes,
      };

      if (allocationMode === "new") {
        const cleanMobile = newResidentMobile.replace(/\D/g, "").slice(-10);
        if (!newResidentName.trim()) {
          throw new Error("Please enter resident name");
        }
        if (cleanMobile.length !== 10) {
          throw new Error("Please enter a valid 10-digit mobile number");
        }
        payload.residentName = newResidentName.trim();
        payload.residentMobile = cleanMobile;

        // Save recent items
        saveRecentItem("recent_resident_names", newResidentName.trim());
        saveRecentItem("recent_resident_mobiles", cleanMobile);
      } else {
        if (!selectedResidentId) {
          throw new Error("Please select an approved resident");
        }
        payload.residentId = selectedResidentId;
      }

      if (notes.trim()) {
        saveRecentItem("recent_bed_notes", notes.trim());
      }

      const res = await fetch("/api/beds/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Allocation failed");

      if (data.tempPassword) {
        // Display credentials view
        setCredentials({
          name: data.resident?.name || newResidentName,
          mobile: data.resident?.mobile || newResidentMobile,
          tempPassword: data.tempPassword,
          bedNumber: bed.bedNumber,
          roomNumber: bed.roomNumber,
        });
        setSuccess(data.message);
      } else {
        setSuccess(data.message);
        setTimeout(() => {
          onRefresh();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!credentials?.tempPassword) return;
    navigator.clipboard.writeText(credentials.tempPassword);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyFullInvitation = () => {
    if (!credentials) return;
    const text = `🏡 *Welcome to Rudra Co-Living!*\n\nHi ${credentials.name},\nYour bed has been allocated:\n📍 Bed: ${credentials.bedNumber} (Room ${credentials.roomNumber})\n\n🔑 *Your Login Credentials:*\nPortal: ${window.location.origin}/login\nMobile: ${credentials.mobile}\nTemporary Password / OTP: ${credentials.tempPassword}\n\n*Mandatory Next Steps upon login:*\n1. Update to your new private password.\n2. Upload your Passport Photo & Aadhaar Card for admin approval.`;
    navigator.clipboard.writeText(text);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!credentials) return;
    const cleanMobile = credentials.mobile.replace(/\D/g, "").slice(-10);
    const text = `🏡 *Welcome to Rudra Co-Living!*\n\nHi ${credentials.name},\nYour bed has been allocated:\n📍 Bed: ${credentials.bedNumber} (Room ${credentials.roomNumber})\n\n🔑 *Your Login Credentials:*\nPortal: ${window.location.origin}/login\nMobile: ${credentials.mobile}\nTemporary Password / OTP: ${credentials.tempPassword}\n\n*Mandatory Next Steps upon login:*\n1. Update to your new private password.\n2. Upload your Passport Photo & Aadhaar Card for admin approval.`;
    const url = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleDeallocate = async () => {
    if (!confirm(`Are you sure you want to move out the resident and make Bed ${bed.bedNumber} available?`)) {
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/beds/deallocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedId: bed._id,
          moveOutDate: new Date().toISOString(),
          notes: moveOutNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deallocation failed");

      setSuccess(data.message);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "available" | "maintenance") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/beds/${bed._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bed status");

      setSuccess(data.message);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (credentials) onRefresh();
        onClose();
      }}
      title={`Bed ${bed.bedNumber} Details`}
      description={`Room ${bed.roomNumber} · Floor ${bed.floorNumber} · Status: ${bed.status.toUpperCase()}`}
      maxWidth="lg"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && !credentials && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Case 1: Bed Allocated -> Credentials Card Display */}
      {credentials && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-base mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Bed Allocated & Account Created
            </div>
            <p className="text-xs text-emerald-800">
              A temporary password has been generated for {credentials.name}. Share this code or the full invitation with the resident to complete their account setup.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3 font-mono text-sm border border-slate-800 shadow-md">
            <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>RESIDENT CREDENTIALS</span>
              <span className="text-emerald-400">Bed {credentials.bedNumber} (Rm {credentials.roomNumber})</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Resident Name</span>
                <span className="font-semibold text-slate-200 font-sans">{credentials.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Login Mobile</span>
                <span className="font-semibold text-slate-200">+91 {credentials.mobile}</span>
              </div>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg flex items-center justify-between border border-slate-700">
              <div>
                <span className="text-[10px] text-amber-400 font-semibold block uppercase tracking-wider">
                  Temporary Password / OTP Code
                </span>
                <span className="text-lg font-bold text-amber-300 tracking-wider font-mono select-all">
                  {credentials.tempPassword}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy only this code"
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs flex items-center gap-1.5 transition-colors font-semibold"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? "Code Copied!" : "Copy Code"}
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-700" /> Resident Onboarding & Activation Flow:
            </p>
            <ol className="list-decimal pl-5 space-y-0.5 text-amber-800">
              <li>Resident logs in with temporary password.</li>
              <li>Resident sets permanent password, mandatory Email ID, demographic details, and uploads Passport Photo & Aadhaar.</li>
              <li>Property Admin reviews and approves profile in Approvals tab to unlock resident dashboard.</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share via WhatsApp
            </button>
            <button
              type="button"
              onClick={handleCopyFullInvitation}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedFull ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedFull ? "Message Copied!" : "Copy Full Details"}
            </button>
            <button
              type="button"
              onClick={() => {
                onRefresh();
                onClose();
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Case 2: Bed is Available -> Show Allocation Form */}
      {bed.status === "available" && !credentials && (
        <form onSubmit={handleAllocate} className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex border border-slate-200 rounded-lg p-1 bg-slate-50 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAllocationMode("new")}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                allocationMode === "new"
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Allocate New Resident
            </button>
            <button
              type="button"
              onClick={() => setAllocationMode("existing")}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                allocationMode === "existing"
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" /> Existing Registered Resident
            </button>
          </div>

          {allocationMode === "new" ? (
            <div className="space-y-3 bg-slate-50/70 p-3.5 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Resident Full Name <span className="text-red-500">*</span>
                </label>
                <RecentInput
                  storageKey="recent_resident_names"
                  value={newResidentName}
                  onChange={(e) => setNewResidentName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Resident Phone Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <RecentInput
                  storageKey="recent_resident_mobiles"
                  type="tel"
                  maxLength={10}
                  value={newResidentMobile}
                  onChange={(e) => setNewResidentMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 flex items-start gap-2">
                <Key className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  The system will automatically create an account with a random temporary password. The resident will be guided to change password and upload photo + Aadhaar upon login.
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Approved Resident
              </label>
              {approvedResidents.length > 0 ? (
                <select
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {approvedResidents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (+91 {r.mobile})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
                  No unallocated approved residents found. Please use &quot;Allocate New Resident&quot; above to onboard directly with Name and Mobile.
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Move-In Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Agreed Monthly Rent (₹)
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                min="1000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Allocation Notes (Optional)
            </label>
            <RecentInput
              storageKey="recent_bed_notes"
              type="text"
              placeholder="e.g. Requested lower bunk, 6-month contract"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleStatusChange("maintenance")}
              disabled={loading}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-2 border border-slate-200 rounded-lg transition-colors hover:bg-slate-50"
            >
              Mark Maintenance
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (allocationMode === "existing" && approvedResidents.length === 0)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Allocating..." : "Allocate Bed"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Case 3: Bed is Occupied -> Show Current Resident Info & Move-out Action */}
      {bed.status === "occupied" && bed.currentResidentId && (
        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200">
                {bed.currentResidentId.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-base">{bed.currentResidentId.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">+91 {bed.currentResidentId.mobile}</p>
                <span className="inline-block mt-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Active Resident
                </span>
              </div>
            </div>

            <Link
              href={`/admin/residents/${bed.currentResidentId._id}`}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              Full Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Monthly Rent</span>
              <span className="font-semibold text-slate-900 text-sm">
                ₹{bed.monthlyRent.toLocaleString("en-IN")}/mo
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Move-in Date</span>
              <span className="font-semibold text-slate-900 text-sm">
                {bed.allocation?.startDate
                  ? new Date(bed.allocation.startDate).toLocaleDateString("en-IN")
                  : "Active"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-rose-700 mb-1">
              Deallocate Bed & Delete Resident Account
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Deallocating this bed marks it <strong>Available</strong> for new bookings and permanently deletes this resident&apos;s account.
            </p>
            <RecentInput
              storageKey="recent_moveout_notes"
              type="text"
              placeholder="Move-out reason or settlement notes (optional)..."
              value={moveOutNotes}
              onChange={(e) => setMoveOutNotes(e.target.value)}
              className="mb-3"
            />
            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={handleDeallocate}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <UserMinus className="w-4 h-4" />
                {loading ? "Processing Deallocation..." : "Deallocate & Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case 4: Bed is Maintenance */}
      {bed.status === "maintenance" && (
        <div className="space-y-4 text-center py-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-sm">
            Bed is currently marked as under maintenance or service.
          </div>
          <button
            type="button"
            onClick={() => handleStatusChange("available")}
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            {loading ? "Updating..." : "Mark as Available for Booking"}
          </button>
        </div>
      )}
    </Modal>
  );
}
