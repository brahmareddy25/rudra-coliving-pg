"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";
import { Zap, PlusCircle, RefreshCw, Calendar, CheckCircle2, ArrowRight, Calculator } from "lucide-react";

export default function UrjaviElectricityPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expectedAmount, setExpectedAmount] = useState<number>(25000);
  const [actualAmountReceived, setActualAmountReceived] = useState<number>(25000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState(`URJ-${Date.now().toString().slice(-6)}`);
  const [status, setStatus] = useState("reconciled");
  const [notes, setNotes] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/electricity");
      const data = await res.json();
      if (data.records) setRecords(data.records);
      if (data.summary) setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg("");

    try {
      if (referenceNumber) saveRecentItem("electricity_ref", referenceNumber);
      if (notes) saveRecentItem("electricity_notes", notes);

      const res = await fetch("/api/electricity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingMonth,
          expectedAmount,
          actualAmountReceived,
          paymentDate,
          referenceNumber,
          status,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setSaveMsg(data.message);
      setTimeout(() => {
        setIsModalOpen(false);
        fetchRecords();
      }, 1000);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <AdminLayout title="Urjavi Electricity Tracking">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Provider Integration
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Urjavi Electricity Revenue Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Track expected monthly payments from Urjavi and offset them against the complete PG electricity bill.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/expenses"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" /> Go to Expense Deduction
            </Link>
            <button
              onClick={fetchRecords}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => {
                setBillingMonth(new Date().toISOString().slice(0, 7));
                setExpectedAmount(25000);
                setActualAmountReceived(25000);
                setPaymentDate(new Date().toISOString().slice(0, 10));
                setReferenceNumber(`URJ-${Date.now().toString().slice(-6)}`);
                setStatus("reconciled");
                setNotes("");
                setSaveMsg("");
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Record Urjavi Receipt
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                Total Expected Revenue
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                ₹{summary.totalExpected.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-500">{summary.count} monthly billing cycles</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                Total Actually Received
              </span>
              <p className="text-xl font-black text-emerald-600 mt-1">
                ₹{summary.totalReceived.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Credited to property</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                Outstanding Balance
              </span>
              <p className="text-xl font-black text-rose-600 mt-1">
                ₹{summary.totalPending.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-rose-500 font-medium">Pending from Urjavi</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                Reconciliation Rate
              </span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {summary.count > 0
                  ? Math.round((summary.reconciledCount / summary.count) * 100)
                  : 0}
                %
              </p>
              <span className="text-[10px] text-slate-500">
                {summary.reconciledCount} of {summary.count} cycles settled
              </span>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Expected (₹)</th>
                  <th className="py-3 px-4">Received (₹)</th>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Expense Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No electricity records found. Click &quot;Record Urjavi Receipt&quot; above.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {r.billingMonth}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        ₹{r.expectedAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        ₹{r.actualAmountReceived.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {r.referenceNumber || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {r.paymentDate
                          ? new Date(r.paymentDate).toLocaleDateString("en-IN")
                          : "Pending"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            r.status === "reconciled"
                              ? "paid"
                              : r.status === "partially_received"
                              ? "partially_paid"
                              : "pending"
                          }
                        >
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {r.notes || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/admin/expenses"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-bold text-[11px] transition-colors"
                        >
                          <Zap className="w-3 h-3 text-amber-600" /> Offset in Expenses
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Entry Modal */}
        {isModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
            title="Record Monthly Urjavi Electricity Receipt"
          >
            {saveMsg && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">{saveMsg}</div>
            )}
            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Billing Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Reconciliation Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="reconciled">Reconciled</option>
                    <option value="received">Received in full</option>
                    <option value="partially_received">Partially received</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Expected Revenue (₹) *
                  </label>
                  <input
                    type="number"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Actual Received (₹)
                  </label>
                  <input
                    type="number"
                    value={actualAmountReceived}
                    onChange={(e) => setActualAmountReceived(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Reference / NEFT UTR
                  </label>
                  <RecentInput
                    storageKey="electricity_ref"
                    placeholder="e.g. URJ-202610-881"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Notes</label>
                <RecentInput
                  storageKey="electricity_notes"
                  placeholder="e.g. Reconciliation notes with meter readings"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  disabled={saveLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {saveLoading ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
