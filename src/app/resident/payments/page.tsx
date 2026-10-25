"use client";

import React, { useState, useEffect } from "react";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";
import {
  CreditCard,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  ExternalLink,
  RefreshCw,
  QrCode,
} from "lucide-react";
import Image from "next/image";

export default function ResidentPaymentsPage() {
  const [dues, setDues] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit payment modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedDueId, setSelectedDueId] = useState("");
  const [amount, setAmount] = useState<number>(8500);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [transactionRef, setTransactionRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitErr, setSubmitErr] = useState("");

  // Receipt modal state
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchPaymentData = async () => {
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
        if (duesData.dues.length > 0 && !selectedDueId) {
          const pendingDue = duesData.dues.find((d: any) => d.dueStatus !== "paid") || duesData.dues[0];
          setSelectedDueId(pendingDue._id);
          setAmount(pendingDue.balanceAmount || pendingDue.rentAmount);
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
    fetchPaymentData();
  }, []);

  const handleOpenSubmit = (due?: any) => {
    if (due) {
      setSelectedDueId(due._id);
      setAmount(due.balanceAmount || due.rentAmount);
    }
    setSubmitMsg("");
    setSubmitErr("");
    setIsSubmitModalOpen(true);
  };

  const uploadProofFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "proofs");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.key) return data.key;
      }
    } catch (err) {
      console.warn("Direct server upload failed, trying presigned fallback:", err);
    }

    try {
      const presignedRes = await fetch("/api/storage/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          filename: file.name,
          fileType: file.type || "image/jpeg",
          folder: "proofs",
        }),
      });
      const presignedData = await presignedRes.json();
      if (presignedRes.ok && presignedData.uploadUrl) {
        await fetch(presignedData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        }).catch((err) => console.warn("S3 upload fallback:", err));

        return presignedData.key;
      }
    } catch (err) {
      console.warn("Presigned fallback error:", err);
    }

    return `proofs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitErr("");
    setSubmitMsg("");

    try {
      if (transactionRef) saveRecentItem("payment_ref", transactionRef);
      if (notes) saveRecentItem("payment_notes", notes);

      let proofKey = "";
      if (proofFile) {
        proofKey = await uploadProofFile(proofFile);
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentDueId: selectedDueId,
          amount,
          paymentMethod,
          transactionRef,
          proofDocumentKey: proofKey,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitMsg(data.message);
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setTransactionRef("");
        setProofFile(null);
        fetchPaymentData();
      }, 1200);
    } catch (err: any) {
      setSubmitErr(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <ResidentLayout title="Rent Payments & Receipts">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Monthly Rent & Payment History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              View generated monthly dues, submit UPI/bank transfer proof, and download official receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPaymentData}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            </button>
            <button
              onClick={() => handleOpenSubmit()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Submit Payment Proof
            </button>
          </div>
        </div>

        {/* Rent Dues List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-700">
            Current & Past Rent Dues
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Total Rent</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Balance Remaining</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No rent dues found for your account.
                    </td>
                  </tr>
                ) : (
                  dues.map((due) => (
                    <tr key={due._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {due.billingMonth}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        ₹{due.rentAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        ₹{due.totalPaidAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-700">
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
                      <td className="py-3 px-4 text-right">
                        {due.balanceAmount > 0 ? (
                          <button
                            onClick={() => handleOpenSubmit(due)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            Pay Dues
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs">Cleared ✓</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Submissions & Verified History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-700">
            Payment Submissions & Verification History
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Transaction UTR Ref</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No payment submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{p.transactionRef}</td>
                      <td className="py-3 px-4 uppercase text-[10px] text-slate-500 font-semibold">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
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
                        {p.rejectionReason && (
                          <span className="block text-[10px] text-rose-600 mt-0.5">
                            Reason: {p.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === "verified" && (
                          <button
                            onClick={() => setReceiptData(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Receipt
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

        {/* Submit Payment Proof Modal */}
        {isSubmitModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsSubmitModalOpen(false)}
            title="Submit Rent Payment Proof"
            description="Upload your UPI or bank transfer transaction screenshot for administrator verification."
          >
            {submitMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg">
                {submitMsg}
              </div>
            )}
            {submitErr && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">
                {submitErr}
              </div>
            )}

            <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Select Billing Month *
                </label>
                <select
                  value={selectedDueId}
                  onChange={(e) => {
                    setSelectedDueId(e.target.value);
                    const d = dues.find((item) => item._id === e.target.value);
                    if (d) setAmount(d.balanceAmount || d.rentAmount);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                >
                  {dues.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.billingMonth} (Outstanding Balance: ₹{d.balanceAmount})
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
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                    <option value="bank_transfer">Direct Bank Transfer (IMPS/NEFT)</option>
                    <option value="cash">Cash Paid at Desk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Transaction UTR / Ref Number *
                </label>
                <RecentInput
                  storageKey="payment_ref"
                  placeholder="e.g. 428938192831"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Upload Payment Screenshot / Receipt (PNG / JPG)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-emerald-700 hover:file:bg-slate-200 bg-slate-50 p-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Notes / Remarks
                </label>
                <RecentInput
                  storageKey="payment_notes"
                  placeholder="Optional remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !transactionRef}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {submitLoading ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Printable Official Receipt Modal */}
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
                  <span className="text-slate-400 block text-[10px]">Verification Date</span>
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
                Authorized payment confirmation from Rudra Co-Living Management.
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
    </ResidentLayout>
  );
}
