"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RecentInput, RecentTextarea, saveRecentItem } from "@/components/ui/RecentInput";
import {
  Receipt,
  PlusCircle,
  Search,
  Download,
  Trash2,
  Edit2,
  RefreshCw,
  Zap,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Calendar,
  Filter,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [paidBy, setPaidBy] = useState("all");
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "groceries",
    amount: 5000,
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "upi",
    paidBy: "",
    vendor: "",
    description: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Urjavi Current Bill Deduction Flow
  const [isUrjaviModalOpen, setIsUrjaviModalOpen] = useState(false);
  const [urjaviMonth, setUrjaviMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [totalCurrentBill, setTotalCurrentBill] = useState<number>(35000);
  const [urjaviPaidBy, setUrjaviPaidBy] = useState("Property Owner");
  const [urjaviPayMethod, setUrjaviPayMethod] = useState("bank_transfer");
  const [urjaviBillDate, setUrjaviBillDate] = useState(new Date().toISOString().slice(0, 10));

  // Prompt Pop-up: When Urjavi amount received is not entered yet
  const [isUrjaviPromptOpen, setIsUrjaviPromptOpen] = useState(false);
  const [promptUrjaviAmount, setPromptUrjaviAmount] = useState<number>(20000);
  const [promptUrjaviRef, setPromptUrjaviRef] = useState("");
  const [urjaviPromptLoading, setUrjaviPromptLoading] = useState(false);

  // Confirmation Pop-up: Showing calculation
  const [isUrjaviConfirmOpen, setIsUrjaviConfirmOpen] = useState(false);
  const [urjaviCalc, setUrjaviCalc] = useState<{
    month: string;
    totalBill: number;
    urjaviReceived: number;
    netExpense: number;
    paidBy: string;
  } | null>(null);
  const [urjaviConfirmLoading, setUrjaviConfirmLoading] = useState(false);

  const periodLabels: Record<string, string> = {
    all: "All Time",
    today: "Today",
    this_month: "This Month",
    last_month: "Last Month",
    last_3_months: "Last 3 Months",
    this_year: "This Year",
    custom: "Custom Range",
  };

  const categoryLabels: Record<string, string> = {
    all: "All Categories",
    kitchen: "Kitchen",
    groceries: "Groceries",
    salaries: "Staff Salaries",
    electricity: "Electricity",
    water: "Water",
    internet: "Internet",
    cleaning: "Cleaning",
    repairs: "Repairs",
    maintenance: "Maintenance",
    building_rent: "Building Rent",
    miscellaneous: "Miscellaneous",
  };

  const paymentMethodLabels: Record<string, string> = {
    all: "All Modes",
    upi: "UPI",
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    card: "Debit/Credit Card",
    cheque: "Cheque",
  };

  const fetchExpenses = async (customParams?: { search?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const s = customParams?.search !== undefined ? customParams.search : search;
      if (s) params.append("search", s);
      if (category !== "all") params.append("category", category);
      if (paymentMethod !== "all") params.append("paymentMethod", paymentMethod);
      if (paidBy !== "all") params.append("paidBy", paidBy);
      if (period !== "all") params.append("period", period);
      if (period === "custom") {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      }

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.expenses) setExpenses(data.expenses);
      if (data.summary) setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [category, paymentMethod, paidBy, period, startDate, endDate]);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setPaymentMethod("all");
    setPaidBy("all");
    setPeriod("all");
    setStartDate("");
    setEndDate("");
    fetchExpenses({ search: "" });
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "all" ||
    paymentMethod !== "all" ||
    paidBy !== "all" ||
    period !== "all" ||
    startDate !== "" ||
    endDate !== "";

  // Derive unique payers for filter dropdown
  const allPayers = Array.from(
    new Set([
      "Property Owner",
      "PG Manager",
      "Warden",
      "Staff",
      "Admin",
      ...expenses.map((e) => e.paidBy).filter(Boolean),
    ])
  );

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      title: "",
      category: "groceries",
      amount: 5000,
      expenseDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "upi",
      paidBy: "",
      vendor: "",
      description: "",
    });
    setSaveMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: any) => {
    setEditId(exp._id);
    setFormData({
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      expenseDate: exp.expenseDate.slice(0, 10),
      paymentMethod: exp.paymentMethod,
      paidBy: exp.paidBy || "",
      vendor: exp.vendor || "",
      description: exp.description || "",
    });
    setSaveMsg("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete expense "${title}"?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchExpenses();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg("");

    try {
      // Save recent items into history
      saveRecentItem("expense_title", formData.title);
      if (formData.paidBy) saveRecentItem("expense_paid_by", formData.paidBy);
      if (formData.vendor) saveRecentItem("expense_vendor", formData.vendor);
      if (formData.description) saveRecentItem("expense_description", formData.description);

      const url = editId ? `/api/expenses/${editId}` : "/api/expenses";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save expense");

      setSaveMsg(data.message);
      setTimeout(() => {
        setIsModalOpen(false);
        fetchExpenses();
      }, 1000);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Urjavi Electricity Deduction Workflow
  // -------------------------------------------------------------
  const handleOpenUrjaviFlow = () => {
    setUrjaviMonth(new Date().toISOString().slice(0, 7));
    setTotalCurrentBill(35000);
    setUrjaviPaidBy("Property Owner");
    setUrjaviPayMethod("bank_transfer");
    setUrjaviBillDate(new Date().toISOString().slice(0, 10));
    setPromptUrjaviRef(`URJ-${Date.now().toString().slice(-6)}`);
    setIsUrjaviModalOpen(true);
  };

  const handleCheckUrjaviAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urjaviPaidBy) saveRecentItem("expense_paid_by", urjaviPaidBy);

    try {
      // Fetch Urjavi records to see if this month was entered
      const res = await fetch("/api/electricity");
      const data = await res.json();
      const records = data.records || [];
      const match = records.find((r: any) => r.billingMonth === urjaviMonth);

      if (match && Number(match.actualAmountReceived) > 0) {
        // Urjavi amount received exists! Proceed directly to confirmation pop-up
        const urjaviReceived = Number(match.actualAmountReceived);
        const netExpense = Math.max(0, totalCurrentBill - urjaviReceived);
        setUrjaviCalc({
          month: urjaviMonth,
          totalBill: totalCurrentBill,
          urjaviReceived,
          netExpense,
          paidBy: urjaviPaidBy,
        });
        setIsUrjaviModalOpen(false);
        setIsUrjaviConfirmOpen(true);
      } else {
        // Urjavi amount received is not entered yet for this month! Show prompt pop-up
        setIsUrjaviModalOpen(false);
        setIsUrjaviPromptOpen(true);
      }
    } catch (err: any) {
      alert("Error checking Urjavi records: " + err.message);
    }
  };

  const handleSavePromptUrjavi = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrjaviPromptLoading(true);
    try {
      // Save Urjavi record
      const res = await fetch("/api/electricity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingMonth: urjaviMonth,
          expectedAmount: Number(promptUrjaviAmount),
          actualAmountReceived: Number(promptUrjaviAmount),
          paymentDate: urjaviBillDate,
          referenceNumber: promptUrjaviRef.trim() || `URJ-${Date.now().toString().slice(-6)}`,
          status: "reconciled",
          notes: `Recorded during ${urjaviMonth} grid electricity bill reconciliation`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record Urjavi receipt");

      // Now set calculation and show confirmation pop-up
      const urjaviReceived = Number(promptUrjaviAmount);
      const netExpense = Math.max(0, totalCurrentBill - urjaviReceived);
      setUrjaviCalc({
        month: urjaviMonth,
        totalBill: totalCurrentBill,
        urjaviReceived,
        netExpense,
        paidBy: urjaviPaidBy,
      });

      setIsUrjaviPromptOpen(false);
      setIsUrjaviConfirmOpen(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUrjaviPromptLoading(false);
    }
  };

  const handleConfirmAndAddExpense = async () => {
    if (!urjaviCalc) return;
    setUrjaviConfirmLoading(true);

    try {
      const title = `Electricity Bill - ${urjaviCalc.month}`;
      const description = `Complete PG Current Bill: ₹${urjaviCalc.totalBill.toLocaleString(
        "en-IN"
      )} minus Urjavi solar received: ₹${urjaviCalc.urjaviReceived.toLocaleString(
        "en-IN"
      )} = Net Expense: ₹${urjaviCalc.netExpense.toLocaleString("en-IN")}`;

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: "electricity",
          amount: urjaviCalc.netExpense,
          expenseDate: urjaviBillDate,
          paymentMethod: urjaviPayMethod,
          paidBy: urjaviCalc.paidBy,
          vendor: "State Power Grid / Electricity Board",
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record net electricity expense");

      setIsUrjaviConfirmOpen(false);
      fetchExpenses();
      alert(`Success! Recorded ₹${urjaviCalc.netExpense.toLocaleString("en-IN")} as net electricity expense for ${urjaviCalc.month}.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUrjaviConfirmLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Title",
      "Category",
      "Amount (INR)",
      "Date",
      "Paid By",
      "Payment Method",
      "Vendor",
      "Description",
    ];
    const rows = expenses.map((e) => [
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.expenseDate.slice(0, 10),
      `"${(e.paidBy || "").replace(/"/g, '""')}"`,
      e.paymentMethod,
      `"${(e.vendor || "").replace(/"/g, '""')}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rudra_Expenses_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Operating Expenses Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Property Operating Expenses
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record, track, and categorize expenses for food, stay, staff salaries, repairs, and utilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenUrjaviFlow}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" /> Add Electricity Bill (Urjavi Offset)
            </button>
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add New Expense
            </button>
          </div>
        </div>

        {/* Total Cost & Summary Card */}
        {summary && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-slate-800 shadow-lg text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {periodLabels[period] || "Operating Expenses"}
                  </span>
                  {hasActiveFilters && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Filtered View
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3 pt-1">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    ₹{summary.totalAmount.toLocaleString("en-IN")}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Total Cost</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                  <span>
                    <strong className="text-slate-200 font-semibold">{summary.count}</strong> expense records
                  </span>
                  <span>•</span>
                  <span>
                    Avg: <strong className="text-slate-200 font-semibold">₹{summary.averageAmount?.toLocaleString("en-IN") || 0}</strong> / record
                  </span>
                </div>
              </div>

              {/* Quick Period Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/70 p-1.5 rounded-xl border border-slate-700/60 self-start lg:self-auto">
                {(["all", "today", "this_month", "last_month", "last_3_months", "this_year", "custom"] as const).map(
                  (pKey) => (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setPeriod(pKey)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                        period === pKey
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                      )}
                    >
                      {periodLabels[pKey]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Breakdowns */}
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-emerald-400" /> Category Breakdown
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {Object.entries(summary.categoryBreakdown || {}).length === 0 ? (
                    <span className="text-xs text-slate-500">No category data for current filter</span>
                  ) : (
                    Object.entries(summary.categoryBreakdown || {}).map(([cat, amt]: any) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(category === cat ? "all" : cat)}
                        title={`Filter by ${categoryLabels[cat] || cat}`}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all text-left flex items-center gap-1.5",
                          category === cat
                            ? "bg-emerald-500/30 border-emerald-400 text-emerald-300"
                            : "bg-slate-800/80 border-slate-700/70 text-slate-300 hover:border-slate-600 hover:text-white"
                        )}
                      >
                        <span className="capitalize">{cat.replace(/_/g, " ")}:</span>
                        <span className="font-bold text-white">₹{amt.toLocaleString("en-IN")}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Mode Breakdown */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3 h-3 text-emerald-400" /> Payment Modes
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {Object.entries(summary.paymentMethodBreakdown || {}).length === 0 ? (
                    <span className="text-xs text-slate-500">No payment mode data</span>
                  ) : (
                    Object.entries(summary.paymentMethodBreakdown || {}).map(([method, amt]: any) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(paymentMethod === method ? "all" : method)}
                        title={`Filter by ${paymentMethodLabels[method] || method}`}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all text-left flex items-center gap-1.5",
                          paymentMethod === method
                            ? "bg-emerald-500/30 border-emerald-400 text-emerald-300"
                            : "bg-slate-800/80 border-slate-700/70 text-slate-300 hover:border-slate-600 hover:text-white"
                        )}
                      >
                        <span className="uppercase">{method.replace(/_/g, " ")}:</span>
                        <span className="font-bold text-white">₹{amt.toLocaleString("en-IN")}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Active Filters Bar */}
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Active Filters:</span>
                  {period !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-emerald-950 border border-emerald-700 text-emerald-300">
                      Period: {periodLabels[period] || period}
                      <button
                        type="button"
                        onClick={() => {
                          setPeriod("all");
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="hover:text-white ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {period === "custom" && (startDate || endDate) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-emerald-950 border border-emerald-700 text-emerald-300">
                      {startDate || "Any"} to {endDate || "Any"}
                    </span>
                  )}
                  {category !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-emerald-950 border border-emerald-700 text-emerald-300">
                      Category: {categoryLabels[category] || category}
                      <button type="button" onClick={() => setCategory("all")} className="hover:text-white ml-0.5">
                        ×
                      </button>
                    </span>
                  )}
                  {paymentMethod !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-emerald-950 border border-emerald-700 text-emerald-300">
                      Mode: {paymentMethodLabels[paymentMethod] || paymentMethod}
                      <button type="button" onClick={() => setPaymentMethod("all")} className="hover:text-white ml-0.5">
                        ×
                      </button>
                    </span>
                  )}
                  {paidBy !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-emerald-950 border border-emerald-700 text-emerald-300">
                      Paid By: {paidBy}
                      <button type="button" onClick={() => setPaidBy("all")} className="hover:text-white ml-0.5">
                        ×
                      </button>
                    </span>
                  )}
                  {search.trim() && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-emerald-950 border border-emerald-700 text-emerald-300">
                      Search: &ldquo;{search}&rdquo;
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          fetchExpenses({ search: "" });
                        }}
                        className="hover:text-white ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
              <RecentInput
                storageKey="expense_search"
                placeholder="Search by title, vendor, paid by, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (search) saveRecentItem("expense_search", search);
                    fetchExpenses();
                  }
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    fetchExpenses({ search: "" });
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                <option value="kitchen">Kitchen</option>
                <option value="groceries">Groceries</option>
                <option value="salaries">Staff Salaries</option>
                <option value="electricity">Electricity</option>
                <option value="water">Water</option>
                <option value="internet">Internet</option>
                <option value="cleaning">Cleaning</option>
                <option value="repairs">Repairs</option>
                <option value="maintenance">Maintenance</option>
                <option value="building_rent">Building Rent</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Payment Modes</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Debit / Credit Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Paid By Filter */}
            <div>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Paid By</option>
                {allPayers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Period Selector & Custom Dates & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Time Period:
              </span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {period === "custom" && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Start Date"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-400" /> Reset
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (search) saveRecentItem("expense_search", search);
                  fetchExpenses();
                }}
                className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Apply / Refresh"
              >
                <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{e.title}</span>
                        {e.description && (
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {e.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                          {e.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        ₹{e.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(e.expenseDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {e.paidBy || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{e.vendor || "—"}</td>
                      <td className="py-3 px-4 uppercase text-[10px] text-slate-500 font-mono">
                        {e.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e._id, e.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 1: Standard Add / Edit Expense Modal (With Recent 10 Dropdowns) */}
        {/* ------------------------------------------------------------------ */}
        {isModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
            title={editId ? "Edit Operating Expense" : "Record New Operating Expense"}
          >
            {saveMsg && (
              <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-lg">{saveMsg}</div>
            )}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Expense Title *
                </label>
                <RecentInput
                  storageKey="expense_title"
                  placeholder="e.g. Monthly Grocery & Kitchen Provisions"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 capitalize"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="groceries">Groceries</option>
                    <option value="salaries">Staff Salaries</option>
                    <option value="electricity">Electricity</option>
                    <option value="water">Water</option>
                    <option value="internet">Internet</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="repairs">Repairs</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="building_rent">Building Rent</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    min="1"
                    required
                  />
                </div>
              </div>

              {formData.category === "electricity" && !editId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs">Need to subtract Urjavi Solar amount?</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Use the automated Urjavi Offset Calculator to deduct this month&apos;s solar credits from the grid bill.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleOpenUrjaviFlow();
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold shrink-0"
                  >
                    Use Urjavi Calculator
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Paid By (Who Paid)
                  </label>
                  <RecentInput
                    storageKey="expense_paid_by"
                    placeholder="e.g. Property Owner, PG Manager, Admin"
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="upi">UPI / Online</option>
                    <option value="bank_transfer">Bank Transfer (NEFT)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Debit/Credit Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Vendor / Paid-To
                  </label>
                  <RecentInput
                    storageKey="expense_vendor"
                    placeholder="e.g. Sri Balaji Supermarket"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Description / Notes
                </label>
                <RecentTextarea
                  storageKey="expense_description"
                  rows={2}
                  placeholder="Additional details, invoice references, or items purchased"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors"
                >
                  {saveLoading ? "Saving..." : editId ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 2: Urjavi Electricity Bill Deduction Form */}
        {/* ------------------------------------------------------------------ */}
        {isUrjaviModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsUrjaviModalOpen(false)}
            title="⚡ Monthly PG Current Bill & Urjavi Offset"
          >
            <form onSubmit={handleCheckUrjaviAndProceed} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs text-amber-950">
                  <Calculator className="w-4 h-4 text-amber-600" /> Automated Net Bill Calculation
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Enter the complete electricity bill generated for the PG. The system will subtract this month&apos;s Urjavi received amount and add the remaining net amount directly to Expenses.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Billing Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    value={urjaviMonth}
                    onChange={(e) => setUrjaviMonth(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Total Complete PG Current Bill (₹) *
                  </label>
                  <input
                    type="number"
                    value={totalCurrentBill}
                    onChange={(e) => setTotalCurrentBill(Number(e.target.value))}
                    placeholder="e.g. 35000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-black text-sm"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Paid By *
                  </label>
                  <RecentInput
                    storageKey="expense_paid_by"
                    placeholder="e.g. Property Owner"
                    value={urjaviPaidBy}
                    onChange={(e) => setUrjaviPaidBy(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={urjaviPayMethod}
                    onChange={(e) => setUrjaviPayMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT)</option>
                    <option value="upi">UPI / Online</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Bill Payment Date *
                </label>
                <input
                  type="date"
                  value={urjaviBillDate}
                  onChange={(e) => setUrjaviBillDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUrjaviModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                >
                  Calculate & Proceed <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 3: Prompt Pop-up when Urjavi received amount is missing */}
        {/* ------------------------------------------------------------------ */}
        {isUrjaviPromptOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsUrjaviPromptOpen(false)}
            title="⚠️ Urjavi Amount Received Required First"
          >
            <form onSubmit={handleSavePromptUrjavi} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Urjavi Received Amount Not Found for {urjaviMonth}
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You haven&apos;t entered the Urjavi amount received for <strong>{urjaviMonth}</strong> yet. Please enter the Urjavi amount received first so the system can subtract it from the total current bill.
                </p>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Urjavi Solar Amount Received for {urjaviMonth} (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={promptUrjaviAmount}
                  onChange={(e) => setPromptUrjaviAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-black text-sm"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Urjavi Payment Reference / Receipt No.
                </label>
                <RecentInput
                  storageKey="electricity_ref"
                  placeholder="e.g. URJ-202610-881"
                  value={promptUrjaviRef}
                  onChange={(e) => setPromptUrjaviRef(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUrjaviPromptOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={urjaviPromptLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                >
                  {urjaviPromptLoading ? "Saving..." : "Save Urjavi Amount & Continue"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 4: Confirmation Pop-up with Urjavi Amount and Net Calculation */}
        {/* ------------------------------------------------------------------ */}
        {isUrjaviConfirmOpen && urjaviCalc && (
          <Modal
            isOpen={true}
            onClose={() => setIsUrjaviConfirmOpen(false)}
            title="⚡ Confirm Urjavi Offset & Net Electricity Expense"
          >
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Month: {urjaviCalc.month}
                  </span>
                  <span className="text-[10px] text-slate-400">Reconciliation Breakdown</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Total Complete PG Current Bill:</span>
                    <span className="font-bold text-white text-sm">
                      ₹{urjaviCalc.totalBill.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Minus Urjavi Solar Received:
                    </span>
                    <span className="font-bold text-sm">
                      - ₹{urjaviCalc.urjaviReceived.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-white">
                    <span className="font-extrabold text-sm text-amber-300">
                      Remaining Net Expense to Add:
                    </span>
                    <span className="text-xl font-black text-amber-400">
                      ₹{urjaviCalc.netExpense.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Paid By: <strong className="text-white">{urjaviCalc.paidBy}</strong></span>
                  <span>Payment Mode: <strong className="text-white uppercase">{urjaviPayMethod}</strong></span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Confirming will record <strong>₹{urjaviCalc.netExpense.toLocaleString("en-IN")}</strong> as an Operating Expense under Category: <strong>Electricity</strong>.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUrjaviConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel / Edit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndAddExpense}
                  disabled={urjaviConfirmLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-950/20 flex items-center gap-1.5 transition-colors"
                >
                  {urjaviConfirmLoading ? "Recording..." : `Confirm & Record ₹${urjaviCalc.netExpense.toLocaleString("en-IN")} Expense`}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
