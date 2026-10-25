"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { BarChart3, Download, RefreshCw, FileSpreadsheet, Calendar } from "lucide-react";
import { clsx } from "clsx";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<"financial" | "occupancy" | "expenses" | "residents">("financial");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${reportType}`);
      const json = await res.json();
      if (json.report) setData(json.report);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rudra_${reportType.toUpperCase()}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Reports & Financial Analytics">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Reports & Audit Statements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate reconciled financial statements, occupancy audits, and resident directories with CSV export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={data.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export {reportType.toUpperCase()} CSV
            </button>
          </div>
        </div>

        {/* Report Selection Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { key: "financial", label: "Financial Net Operating Income" },
            { key: "occupancy", label: "Floor & Bed Occupancy Audit" },
            { key: "expenses", label: "Operating Expenses Ledger" },
            { key: "residents", label: "Resident Master Directory" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key as any)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                reportType === tab.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Display Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {reportType === "financial" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Total Billed (₹)</th>
                    <th className="py-3 px-4">Rent Collected (₹)</th>
                    <th className="py-3 px-4">Urjavi Electricity (₹)</th>
                    <th className="py-3 px-4">Outstanding (₹)</th>
                    <th className="py-3 px-4">Operating Expenses (₹)</th>
                    <th className="py-3 px-4">Net Operating Result (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No financial records found.
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{row.month}</td>
                        <td className="py-3 px-4">₹{row.totalBilled.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">
                          ₹{row.totalCollected.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-semibold text-amber-700">
                          ₹{row.electricityReceived.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-semibold text-rose-700">
                          ₹{row.outstanding.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          ₹{row.totalExpenses.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-800 text-sm">
                          ₹{row.netOperatingResult.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {reportType === "occupancy" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Floor</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Bed Number</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Rent (₹/mo)</th>
                    <th className="py-3 px-4">Occupant Name</th>
                    <th className="py-3 px-4">Occupant Mobile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">{b.floor}</td>
                      <td className="py-3 px-4">{b.room}</td>
                      <td className="py-3 px-4 font-bold text-blue-800">{b.bed}</td>
                      <td className="py-3 px-4">
                        <Badge variant={b.status}>{b.status}</Badge>
                      </td>
                      <td className="py-3 px-4">₹{b.monthlyRent.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 font-medium">{b.occupantName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{b.occupantMobile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "residents" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Bed</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                      <td className="py-3 px-4 font-mono">+91 {r.mobile}</td>
                      <td className="py-3 px-4 text-slate-500">{r.email}</td>
                      <td className="py-3 px-4 font-medium">{r.roomNumber}</td>
                      <td className="py-3 px-4 font-bold text-blue-800">{r.bedNumber}</td>
                      <td className="py-3 px-4">
                        <Badge variant={r.status === "active" ? "paid" : "pending"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.registrationDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "expenses" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount (₹)</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{e.title}</td>
                      <td className="py-3 px-4 capitalize">{e.category.replace(/_/g, " ")}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{e.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">{e.date}</td>
                      <td className="py-3 px-4">{e.vendor}</td>
                      <td className="py-3 px-4 uppercase font-mono">{e.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
