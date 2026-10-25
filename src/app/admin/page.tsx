"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/StatCard";
import {
  Users,
  Bed,
  CreditCard,
  Receipt,
  Zap,
  ShieldCheck,
  Wrench,
  Percent,
  PlusCircle,
  FileCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((dash) => setData(dash))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recentActivity = data?.recentActivity || [];

  const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-6">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white border border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Property Management Suite
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                Live System
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">Rudra Co-Living Overview</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Real-time monitoring across 4 floors, 24 rooms, and 80 configured beds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/beds"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Bed className="w-3.5 h-3.5" /> Floor Plan
            </Link>
            <Link
              href="/admin/payments"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" /> Payments
            </Link>
          </div>
        </div>

        {/* 1. Core KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Residents"
            value={summary.totalResidents || 0}
            subtitle={`${summary.occupiedBeds || 0} currently allocated`}
            icon={Users}
            accentColor="blue"
          />

          <StatCard
            title="Bed Occupancy"
            value={`${summary.occupancyPercentage || 0}%`}
            subtitle={`${summary.availableBeds || 0} beds available of ${summary.totalBeds || 80}`}
            icon={Percent}
            accentColor="emerald"
          />

          <StatCard
            title="Rent Collected (Oct)"
            value={`₹${(summary.rentCollectedThisMonth || 0).toLocaleString("en-IN")}`}
            subtitle={`₹${(summary.outstandingResidentRent || 0).toLocaleString("en-IN")} pending collection`}
            icon={CreditCard}
            accentColor="emerald"
          />

          <StatCard
            title="Operating Expenses"
            value={`₹${(summary.monthlyOperatingExpenses || 0).toLocaleString("en-IN")}`}
            subtitle={`Net Income: ₹${(summary.netOperatingResult || 0).toLocaleString("en-IN")}`}
            icon={Receipt}
            accentColor="amber"
          />
        </div>

        {/* Secondary Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Urjavi Electricity</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                ₹{(summary.electricityAmountReceived || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <Link
            href="/admin/approvals"
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-400 transition-colors"
          >
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Approvals</p>
              <p className="text-lg font-bold text-amber-600 mt-0.5">
                {summary.pendingDocumentApprovals || 0}
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/payments"
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-400 transition-colors"
          >
            <div>
              <p className="text-xs text-slate-500 font-medium">Payment Verifications</p>
              <p className="text-lg font-bold text-blue-600 mt-0.5">
                {summary.pendingPaymentApprovals || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/issues"
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-rose-400 transition-colors"
          >
            <div>
              <p className="text-xs text-slate-500 font-medium">Open Issues</p>
              <p className="text-lg font-bold text-rose-600 mt-0.5">
                {summary.openMaintenanceIssues || 0}
              </p>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <Wrench className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue vs Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Financial Collections vs Operating Expenses</span>
              <span className="text-xs font-normal text-slate-400">Monthly Trends</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="collected" name="Rent Collected" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Operating Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Floor Occupancy Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Occupancy by Floor</span>
              <span className="text-xs font-normal text-slate-400">4 Floors</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.occupancyByFloor || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="floor" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 20]} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="occupied" name="Occupied Beds" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="available" name="Available Beds" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. Expenses Breakdown & Live Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses Category Pie */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Expenses by Category
            </h3>
            <div className="h-56">
              {charts.expensesByCategory?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.expensesByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {charts.expensesByCategory.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No expense records this month
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Audit Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Administrative Activity
              </h3>
              <Link href="/admin/settings" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                View Audit Log →
              </Link>
            </div>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No recent activity logged.</p>
              ) : (
                recentActivity.slice(0, 5).map((log: any) => (
                  <div
                    key={log._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-bold text-slate-800">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-slate-500 ml-2">
                          {log.details?.bedNumber
                            ? `Bed: ${log.details.bedNumber}`
                            : log.details?.title || log.entityType}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
