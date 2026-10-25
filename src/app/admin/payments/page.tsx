"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentInput, RecentTextarea, saveRecentItem } from "@/components/ui/RecentInput";
import {
  CreditCard,
  PlusCircle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Receipt,
  Download,
} from "lucide-react";
import Image from "next/image";
import { clsx } from "clsx";

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"dues" | "submissions">("dues");
  const [dues, setDues] = useState<any[]>([]);
  const [duesSummary, setDuesSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate dues modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  // Record manual payment modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [manualRentDueId, setManualRentDueId] = useState("");
  const [manualAmount, setManualAmount] = useState<number>(8500);
  const [manualMethod, setManualMethod] = useState("cash");
  const [manualTxRef, setManualTxRef] = useState(`MANUAL-${Date.now().toString().slice(-6)}`);
  const [manualNotes, setManualNotes] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMsg, setManualMsg] = useState("");

  // Verification modal state
  const [verifyPayment, setVerifyPayment] = useState<any>(null);
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Receipt modal state
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [duesRes, payRes] = await Promise.all([
        fetch("/api/payments/dues"),
        fetch("/api/payments"),
      ]);
      const duesData = await duesRes.json();
      const payData = await payRes.json();

      if (duesData.dues) {
        setDues(duesData.dues);
        setDuesSummary(duesData.summary);
        if (duesData.dues.length > 0 && !manualRentDueId) {
          setManualRentDueId(duesData.dues[0]._id);
        }
      }
      if (payData.payments) setPayments(payData.payments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateDues = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setGenMsg("");
    try {
      const res = await fetch("/api/payments/dues/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingMonth: genMonth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setGenMsg(data.message);
      setTimeout(() => {
        setIsGenerateModalOpen(false);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setGenMsg(`Error: ${err.message}`);
    } finally {
      setGenLoading(false);
    }
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    setManualMsg("");

    try {
      const selectedDue = dues.find((d) => d._id === manualRentDueId);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentDueId: manualRentDueId,
          residentId: selectedDue?.residentId?._id,
          amount: manualAmount,
          paymentMethod: manualMethod,
          transactionRef: manualTxRef,
          notes: manualNotes,
          isDirectAdminVerification: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment recording failed");

      if (manualTxRef) saveRecentItem("admin_manual_tx_ref", manualTxRef);
      if (manualNotes) saveRecentItem("admin_payment_notes", manualNotes);

      setManualMsg(data.message);
      setTimeout(() => {
        setIsRecordModalOpen(false);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setManualMsg(`Error: ${err.message}`);
    } finally {
      setManualLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!verifyPayment) return;
    setVerifyLoading(true);

    try {
      const res = await fetch(`/api/payments/${verifyPayment._id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: verifyAction,
          rejectionReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      if (verifyAction === "reject" && rejectionReason) {
        saveRecentItem("admin_rejection_reason", rejectionReason);
      }

      setVerifyPayment(null);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <AdminLayout title="Rent Payments & Billing Ledger">
      <div className="space-y-6">
        {/* Top Summary Bar */}
        {duesSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Rent Billed
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{duesSummary.totalDues.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{duesSummary.count} active billings</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm bg-emerald-50/20">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Total Rent Verified
              </span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                ₹{duesSummary.totalCollected.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                {duesSummary.paidCount} cleared · {duesSummary.partiallyPaidCount} partial
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm bg-rose-50/20">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Outstanding Balance
              </span>
              <p className="text-2xl font-black text-rose-800 mt-1">
                ₹{duesSummary.totalOutstanding.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-rose-600 mt-0.5">{duesSummary.pendingCount} pending dues</p>
            </div>
          </div>
        )}

        {/* Action Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("dues")}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === "dues"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              Rent Dues Ledger
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === "submissions"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              Payment Submissions
              {payments.filter((p) => p.status === "pending_verification").length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              title="Refresh Data"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" /> Generate Monthly Dues
            </button>
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" /> Record Direct Payment
            </button>
          </div>
        </div>

        {/* Tab 1: Rent Dues Table */}
        {activeTab === "dues" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Bed & Room</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Amount Due</th>
                    <th className="py-3 px-4">Collected</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        No rent dues generated yet. Click &quot;Generate Monthly Dues&quot; above.
                      </td>
                    </tr>
                  ) : (
                    dues.map((due) => (
                      <tr key={due._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {due.residentId?.name || "Resident"}
                          <span className="block text-[11px] text-slate-400 font-mono">
                            +91 {due.residentId?.mobile}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {due.bedAllocationId?.bedId?.bedNumber ? (
                            <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                              {due.bedAllocationId.bedId.bedNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{due.billingMonth}</td>
                        <td className="py-3 px-4 font-semibold">
                          ₹{due.rentAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">
                          ₹{due.totalPaidAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-semibold text-rose-700">
                          ₹{due.balanceAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(due.dueDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
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
        )}

        {/* Tab 2: Payment Submissions Table */}
        {activeTab === "submissions" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method & Ref</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Proof Screenshot</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {p.residentId?.name}
                          <span className="block text-[11px] text-slate-400 font-mono">
                            +91 {p.residentId?.mobile}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-800 block">{p.transactionRef}</span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {p.rentDueId?.billingMonth || "—"}
                        </td>
                        <td className="py-3 px-4">
                          {p.proofViewUrl ? (
                            <a
                              href={p.proofViewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View Proof
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No file attached</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
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
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {p.status === "pending_verification" && (
                            <>
                              <button
                                onClick={() => {
                                  setVerifyPayment(p);
                                  setVerifyAction("approve");
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px]"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => {
                                  setVerifyPayment(p);
                                  setVerifyAction("reject");
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[11px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {p.status === "verified" && (
                            <button
                              onClick={() => setReceiptData(p)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] inline-flex items-center gap-1"
                            >
                              <Receipt className="w-3 h-3" /> Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generate Monthly Dues Modal */}
        {isGenerateModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsGenerateModalOpen(false)}
            title="Batch Generate Monthly Rent Dues"
            description="Idempotent generation: creates rent dues for all residents with active allocations for the specified month."
          >
            {genMsg && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">{genMsg}</div>
            )}
            <form onSubmit={handleGenerateDues} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Billing Month (YYYY-MM) *
                </label>
                <input
                  type="month"
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {genLoading ? "Generating..." : "Generate Dues"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Record Manual Payment Modal */}
        {isRecordModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsRecordModalOpen(false)}
            title="Record Direct Cash / Bank / UPI Payment"
            description="Directly mark a payment verified and deduct it from the resident's outstanding rent balance."
          >
            {manualMsg && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">
                {manualMsg}
              </div>
            )}
            <form onSubmit={handleRecordManualPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Select Rent Due Record *
                </label>
                <select
                  value={manualRentDueId}
                  onChange={(e) => {
                    setManualRentDueId(e.target.value);
                    const d = dues.find((item) => item._id === e.target.value);
                    if (d) setManualAmount(d.balanceAmount || d.rentAmount);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  {dues.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.residentId?.name} — {d.billingMonth} (Balance: ₹{d.balanceAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="cash">Cash in hand</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="bank_transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="online">Online Gateway</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Transaction Reference / Receipt No *
                </label>
                <RecentInput
                  storageKey="admin_manual_tx_ref"
                  type="text"
                  value={manualTxRef}
                  onChange={(e) => setManualTxRef(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Settlement Notes
                </label>
                <RecentInput
                  storageKey="admin_payment_notes"
                  type="text"
                  placeholder="e.g. Received at reception, cash verified"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {manualLoading ? "Recording..." : "Record & Verify Payment"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Verification Modal */}
        {verifyPayment && (
          <Modal
            isOpen={true}
            onClose={() => setVerifyPayment(null)}
            title={
              verifyAction === "approve"
                ? `Approve Payment (₹${verifyPayment.amount})`
                : `Reject Payment Submission`
            }
          >
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Resident: <strong className="text-slate-900">{verifyPayment.residentId?.name}</strong>{" "}
                (+91 {verifyPayment.residentId?.mobile}) · Amount:{" "}
                <strong className="text-emerald-700 font-bold">
                  ₹{verifyPayment.amount.toLocaleString("en-IN")}
                </strong>{" "}
                · Ref: <span className="font-mono">{verifyPayment.transactionRef}</span>
              </p>

              {verifyAction === "reject" && (
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Rejection Reason *
                  </label>
                  <RecentTextarea
                    storageKey="admin_rejection_reason"
                    rows={3}
                    placeholder="e.g. UTR reference not reflected in property bank account."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyPayment(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifySubmit}
                  disabled={verifyLoading}
                  className={clsx(
                    "px-4 py-2 text-white rounded-lg font-bold transition-colors disabled:opacity-50",
                    verifyAction === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  {verifyLoading ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Official Printable Receipt Modal */}
        {receiptData && (
          <Modal
            isOpen={true}
            onClose={() => setReceiptData(null)}
            title="Official Rent Payment Receipt"
            maxWidth="md"
          >
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 text-xs text-slate-800 font-sans">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-900">
                    <Image src="/images/logo.png" alt="Logo" fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm tracking-wider uppercase">
                      Rudra Co-Living
                    </h4>
                    <p className="text-[10px] text-slate-400">Live · Connect · Thrive</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Receipt No.</span>
                  <span className="font-mono font-bold text-slate-900">
                    RC-{receiptData._id.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Resident Name</span>
                  <span className="font-bold text-slate-900">{receiptData.residentId?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date of Verification</span>
                  <span className="font-semibold text-slate-900">
                    {receiptData.verifiedAt
                      ? new Date(receiptData.verifiedAt).toLocaleDateString("en-IN")
                      : new Date(receiptData.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Transaction Reference</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {receiptData.transactionRef}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Mode</span>
                  <span className="font-semibold text-slate-900 uppercase">
                    {receiptData.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-emerald-900">Amount Received & Verified</span>
                <span className="text-lg font-black text-emerald-800">
                  ₹{receiptData.amount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-100">
                This is a digitally generated receipt authorized by Rudra Co-Living Management.
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
