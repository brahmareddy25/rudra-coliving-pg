"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Settings,
  Shield,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Mail,
  User,
  Building,
  Send,
  Lock,
} from "lucide-react";
import { clsx } from "clsx";

export default function AdminSettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Profile state
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  // SMTP Test state
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState("");
  const [smtpErr, setSmtpErr] = useState("");

  const fetchSettingsAndLogs = async () => {
    setLoading(true);
    try {
      const [settingsRes, logsRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/dashboard"),
      ]);

      const sData = await settingsRes.json();
      if (sData.admin) {
        setSettingsData(sData);
        setAdminName(sData.admin.name || "");
        setAdminEmail(sData.admin.email || "");
        setAdminMobile(sData.admin.mobile || "");
      }

      const lData = await logsRes.json();
      if (lData.recentActivity) setLogs(lData.recentActivity);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErr("");
    setProfileMsg("");
    setProfileLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          name: adminName,
          email: adminEmail,
          mobile: adminMobile,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setProfileMsg(data.message || "Profile updated successfully!");
      setTimeout(() => setProfileMsg(""), 4000);
    } catch (err: any) {
      setProfileErr(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErr("");
    setPassMsg("");

    if (newPassword !== confirmPassword) {
      setPassErr("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPassErr("New password must be at least 6 characters long");
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setPassMsg(data.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassMsg(""), 5000);
    } catch (err: any) {
      setPassErr(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpErr("");
    setSmtpMsg("");
    setSmtpLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_smtp" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch test email");

      setSmtpMsg(data.message);
      setTimeout(() => setSmtpMsg(""), 5000);
    } catch (err: any) {
      setSmtpErr(err.message);
    } finally {
      setSmtpLoading(false);
    }
  };

  return (
    <AdminLayout title="Application Settings & Audit Logs">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            System Settings & Security Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure property preferences, update administrative credentials, test email services, and inspect system audit records.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Profile & Contact Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> Administrator Profile
            </h3>

            {profileMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{profileMsg}</span>
              </div>
            )}
            {profileErr && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{profileErr}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admin Display Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-xs"
              >
                {profileLoading ? "Saving Changes..." : "Save Profile Details"}
              </button>
            </form>
          </div>

          {/* Admin Security & Password Change */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" /> Admin Security Credentials
            </h3>

            {passMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passMsg}</span>
              </div>
            )}
            {passErr && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passErr}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Current Admin Password</label>
                <input
                  type="password"
                  placeholder="Enter current password (e.g. admin123)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors shadow-xs"
              >
                {passLoading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Live Property & Email Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Building Statistics */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" /> Building & Bed Capacity
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Floors</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {settingsData?.property?.floors || 4} Floors
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Shivalik to Trishul</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Rooms</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {settingsData?.property?.rooms || 20} Rooms
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Configured layout</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Max Bed Capacity</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {settingsData?.property?.totalBeds || 71} Beds
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  {settingsData?.property?.occupancyRate || 0}% Occupancy
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <span>Occupied Beds: <strong className="text-slate-900">{settingsData?.property?.occupiedBeds || 0}</strong></span>
              <span>Available Beds: <strong className="text-emerald-700">{settingsData?.property?.availableBeds || 0}</strong></span>
            </div>
          </div>

          {/* Email / SMTP Service Status */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600" /> Email Service (Gmail SMTP)
            </h3>

            {smtpMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{smtpMsg}</span>
              </div>
            )}
            {smtpErr && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{smtpErr}</span>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">SMTP Server Host</span>
                <span className="font-mono text-slate-900 font-semibold">smtp.gmail.com:587</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">Configured Sender Email</span>
                <span className="font-mono text-slate-900 font-semibold">chinthapallivenkat33@gmail.com</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">Integration Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active & Connected
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={smtpLoading}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="w-4 h-4" />
              {smtpLoading ? "Dispatching Test Email..." : "Send Live Test Email"}
            </button>
          </div>
        </div>

        {/* Security Audit Log */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Administrative Audit Trail
            </h3>
            <button
              onClick={fetchSettingsAndLogs}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-50"
              title="Refresh Logs"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity Type</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {log.action.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">{log.entityType}</td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                        {JSON.stringify(log.details || {})}
                      </td>
                      <td className="py-2.5 px-4 capitalize font-semibold text-slate-800">
                        {log.actorRole}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
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
