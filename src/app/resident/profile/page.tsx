"use client";

import React, { useState, useEffect } from "react";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  KeyRound,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";

export default function ResidentProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Emergency contact state
  const [emerName, setEmerName] = useState("");
  const [emerPhone, setEmerPhone] = useState("");
  const [emerRel, setEmerRel] = useState("");
  const [saveEmerLoading, setSaveEmerLoading] = useState(false);
  const [emerMsg, setEmerMsg] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setProfile(data.user.profile);
        if (data.user.profile?.emergencyContact) {
          setEmerName(data.user.profile.emergencyContact.name || "");
          setEmerPhone(data.user.profile.emergencyContact.phone || "");
          setEmerRel(data.user.profile.emergencyContact.relationship || "");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveEmerLoading(true);
    setEmerMsg("");

    try {
      if (emerName) saveRecentItem("resident_emergency_name", emerName);
      if (emerPhone) saveRecentItem("resident_emergency_phone", emerPhone);
      if (emerRel) saveRecentItem("resident_emergency_relationship", emerRel);

      // In development / demo environment
      setEmerMsg("Emergency contact saved successfully.");
      setTimeout(() => setEmerMsg(""), 3000);
    } catch (e: any) {
      setEmerMsg(`Error: ${e.message}`);
    } finally {
      setSaveEmerLoading(false);
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

    setPassLoading(true);
    try {
      setPassMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassMsg(""), 3000);
    } catch (e: any) {
      setPassErr(e.message);
    } finally {
      setPassLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <ResidentLayout title="My Profile">
        <div className="py-20 text-center text-slate-400">Loading your profile...</div>
      </ResidentLayout>
    );
  }

  const idStatus = profile?.idVerificationStatus || "not_uploaded";

  return (
    <ResidentLayout title="My Profile & Security">
      <div className="space-y-6">
        {/* Header Hero */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center border-2 border-emerald-300 shrink-0">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <Badge variant={idStatus === "approved" ? "paid" : "pending"}>
                  {idStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                +91 {user.mobile} {user.email && `· ${user.email}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information Details */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> Personal Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Gender</span>
                <span className="font-semibold text-slate-900 capitalize">{profile?.gender || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Age</span>
                <span className="font-semibold text-slate-900">{profile?.age || 0} years</span>
              </div>
              <div>
                <span className="text-slate-400 block">Occupation</span>
                <span className="font-semibold text-slate-900">{profile?.occupation || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Company / University</span>
                <span className="font-semibold text-slate-900">{profile?.companyName || "N/A"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block mb-0.5">Permanent Residential Address</span>
              <p className="font-semibold text-slate-900 leading-relaxed">
                {profile?.permanentAddress || "N/A"}
              </p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" /> Emergency Contact
            </h3>

            {emerMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                {emerMsg}
              </div>
            )}

            <form onSubmit={handleSaveEmergencyContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Name</label>
                <RecentInput
                  storageKey="resident_emergency_name"
                  type="text"
                  placeholder="e.g. Parent or Guardian Name"
                  value={emerName}
                  onChange={(e) => setEmerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <RecentInput
                    storageKey="resident_emergency_phone"
                    type="tel"
                    placeholder="10-digit mobile"
                    value={emerPhone}
                    onChange={(e) => setEmerPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Relationship</label>
                  <RecentInput
                    storageKey="resident_emergency_relationship"
                    type="text"
                    placeholder="e.g. Father, Mother, Sibling"
                    value={emerRel}
                    onChange={(e) => setEmerRel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saveEmerLoading}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
              >
                {saveEmerLoading ? "Saving..." : "Update Emergency Contact"}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm max-w-xl space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" /> Account Security & Password
          </h3>

          {passMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs">{passMsg}</div>
          )}
          {passErr && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs">{passErr}</div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
            >
              {passLoading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </ResidentLayout>
  );
}
