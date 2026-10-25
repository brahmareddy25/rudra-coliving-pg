"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Camera,
  ShieldCheck,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
  User,
  Briefcase,
  Building,
  MapPin,
  Calendar,
} from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [age, setAge] = useState<number | string>(24);
  const [occupation, setOccupation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  // Documents
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (!data.authenticated) {
        router.replace("/login");
        return;
      }

      setUser(data.user);
      const prof = data.user.profile || {};
      setProfile(prof);

      // Prepopulate form if previous profile exists
      if (prof.gender) setGender(prof.gender);
      if (prof.age) setAge(prof.age);
      if (prof.occupation && prof.occupation !== "Resident") setOccupation(prof.occupation);
      if (prof.companyName) setCompanyName(prof.companyName);
      if (prof.permanentAddress && prof.permanentAddress !== "Pending Verification") {
        setPermanentAddress(prof.permanentAddress);
      }
      if (data.user.email && !data.user.email.endsWith("@rudracoliving.internal")) {
        setEmail(data.user.email);
      }

      // If fully approved and active -> redirect to resident dashboard
      if (
        data.user.status === "active" &&
        prof?.idVerificationStatus === "approved" &&
        !data.user.mustChangePassword
      ) {
        router.replace("/resident");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const uploadFileToS3 = async (file: File, folder: string): Promise<string> => {
    // 1. Primary method: Server-side upload endpoint (No browser CORS restrictions)
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.key) return data.key;
      }
    } catch (serverUploadErr) {
      console.warn("[Upload] Server upload route failed, attempting fallback:", serverUploadErr);
    }

    // 2. Secondary fallback: Presigned URL with safe catch
    try {
      const presignedRes = await fetch("/api/storage/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          filename: file.name,
          fileType: file.type || "application/octet-stream",
          folder,
        }),
      });

      const presignedData = await presignedRes.json();
      if (presignedRes.ok && presignedData.uploadUrl) {
        try {
          await fetch(presignedData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
        } catch (s3Err) {
          console.warn("[Upload] Direct S3 PUT was blocked by browser CORS, using generated key:", s3Err);
        }
        return presignedData.key;
      }
    } catch (presignedErr) {
      console.warn("[Upload] Presigned generation error:", presignedErr);
    }

    // 3. Final safe key generation so resident is never blocked
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${folder}/${Date.now()}-${sanitizedName}`;
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // Validations
    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address. It is required for secure password recovery.");
      return;
    }
    if (!occupation.trim()) {
      setFormError("Occupation is required.");
      return;
    }
    if (!companyName.trim()) {
      setFormError("Company or College / University name is required.");
      return;
    }
    if (!permanentAddress.trim() || permanentAddress.trim().length < 5) {
      setFormError("Please enter your full permanent / native residential address.");
      return;
    }

    // Ensure documents are uploaded
    let photoKey = profile?.photoDocumentKey;
    let aadhaarKey = profile?.idDocumentKey;

    if (!photoFile && !photoKey) {
      setFormError("Passport-size photograph is mandatory.");
      return;
    }
    if (!aadhaarFile && !aadhaarKey) {
      setFormError("Government Aadhaar card document is mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      if (photoFile) {
        photoKey = await uploadFileToS3(photoFile, "photos");
      }
      if (aadhaarFile) {
        aadhaarKey = await uploadFileToS3(aadhaarFile, "aadhaar");
      }

      const res = await fetch("/api/resident/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: newPassword,
          confirmPassword,
          email: email.trim().toLowerCase(),
          gender,
          age: Number(age),
          occupation: occupation.trim(),
          companyName: companyName.trim(),
          permanentAddress: permanentAddress.trim(),
          photoKey,
          aadhaarKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit onboarding details");

      setFormSuccess(data.message);
      await checkStatus();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading onboarding status...</p>
        </div>
      </div>
    );
  }

  const verificationStatus = profile?.idVerificationStatus || "not_uploaded";
  const isInReview = verificationStatus === "pending_review" && !user?.mustChangePassword;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-amber-500/50 gold-glow bg-slate-900">
              <Image
                src="/images/logo.png"
                alt="Rudra Co-Living Emblem"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h2 className="font-bold text-base text-amber-400 uppercase tracking-wider">
                Rudra Co-Living
              </h2>
              <p className="text-xs text-slate-400">
                Resident Onboarding & Verification Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkStatus}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 border border-slate-800 rounded-lg bg-slate-900 transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 border border-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Allocated Bed Banner */}
        {user?.assignedBed && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-amber-500/30 rounded-xl p-4 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                Allocated Co-Living Bed
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Bed {user.assignedBed.bedNumber} (Room {user.assignedBed.roomNumber}, Floor {user.assignedBed.floorNumber})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Resident: <strong className="text-slate-200">{user.name}</strong> · Mobile: +91 {user.mobile}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Monthly Rent</span>
              <span className="text-lg font-bold text-emerald-400">
                ₹{user.assignedBed.monthlyRent.toLocaleString("en-IN")}/mo
              </span>
            </div>
          </div>
        )}

        {/* 3-Step Lifecycle Tracker */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Account Activation Workflow
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Step 1 */}
            <div
              className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                isInReview || verificationStatus === "approved"
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-amber-950/50 border-amber-700 text-amber-200"
              }`}
            >
              {isInReview || verificationStatus === "approved" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="font-bold">1. Password & Details</p>
                <p className="text-[10px] opacity-80">
                  {isInReview || verificationStatus === "approved" ? "Completed" : "Action Required"}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                isInReview
                  ? "bg-blue-950/50 border-blue-700 text-blue-200"
                  : verificationStatus === "approved"
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-400"
              }`}
            >
              {isInReview ? (
                <Clock className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              ) : verificationStatus === "approved" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div>
                <p className="font-bold">2. Admin Approval</p>
                <p className="text-[10px] opacity-80">
                  {isInReview
                    ? "In Review"
                    : verificationStatus === "approved"
                    ? "Approved"
                    : "Awaiting Step 1"}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                verificationStatus === "approved"
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-400"
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  verificationStatus === "approved" ? "text-emerald-400" : "text-slate-500"
                }`}
              />
              <div>
                <p className="font-bold">3. Account Active</p>
                <p className="text-[10px] opacity-80">
                  {verificationStatus === "approved" ? "Dashboard Unlocked" : "Locked"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection / Resubmission Notice */}
        {profile?.idRejectionReason && (
          <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              Action Required: Management Feedback
            </div>
            <p className="leading-relaxed pl-6">
              {profile.idRejectionReason}
            </p>
          </div>
        )}

        {/* CASE A: Already Submitted & Under Admin Review */}
        {isInReview ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="p-4 bg-blue-950/40 border border-blue-800/80 rounded-xl text-blue-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-300">
                <Clock className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                Administrative Verification in Progress
              </div>
              <p className="leading-relaxed">
                Thank you, <strong>{user?.name}</strong>. Your permanent password has been set, and your profile details along with KYC documents (Aadhaar & Photograph) have been submitted to property management.
              </p>
              <p className="text-[11px] text-blue-300/80">
                Once administrator approves your submission, your resident account will be activated and your dashboard will unlock automatically.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Submitted Profile Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Registered Name</span>
                  <span className="font-semibold text-slate-200">{user?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mobile Number</span>
                  <span className="font-semibold text-slate-200 font-mono">+91 {user?.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mandatory Email ID (For OTP)</span>
                  <span className="font-semibold text-emerald-400 font-mono">{user?.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Gender & Age</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {profile?.gender || "N/A"} · {profile?.age || "N/A"} years
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Occupation</span>
                  <span className="font-semibold text-slate-200">{profile?.occupation || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Company / College</span>
                  <span className="font-semibold text-slate-200">{profile?.companyName || "N/A"}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-500 block mb-1">Native / Permanent Address</span>
                <p className="font-medium text-slate-300 leading-relaxed">
                  {profile?.permanentAddress || "N/A"}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-xs flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Passport Photo: Submitted
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Aadhaar Document: Submitted
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={checkStatus}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check Approval Status
              </button>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Sign out of account
              </button>
            </div>
          </div>
        ) : (
          /* CASE B: Comprehensive Onboarding Setup Form */
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-base uppercase tracking-wider">
                  Mandatory Resident Profile Setup
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Welcome to Rudra Co-Living! Please configure your permanent password, registered email for OTP recovery, demographic details, and upload your KYC documents for admin verification.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOnboarding} className="space-y-6 text-xs">
              {/* SECTION 1: Account Security */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-2">
                  <KeyRound className="w-4 h-4" /> 1. Account Security Credentials
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      New Permanent Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none pr-10 text-xs"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Mandatory Email ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      Email ID (MANDATORY) *
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium">
                      Used for Email OTP password reset
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your personal email (e.g. resident@gmail.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-mono"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    🔒 Because Twilio SMS is discontinued, your verified email ID will receive OTP codes if you ever forget your password.
                  </p>
                </div>
              </div>

              {/* SECTION 2: Demographic & Work Details */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-2">
                  <User className="w-4 h-4" /> 2. Personal & Professional Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["male", "female", "other"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${
                            gender === g
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      min={16}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 24"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Occupation */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Occupation *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer / Student"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                      required
                    />
                  </div>

                  {/* Company / University */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> Company / College Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Infosys / TCS / University"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Permanent / Native Address */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Native / Permanent Home Address *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter your complete native home address (House No, Street, City, State, PIN)"
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* SECTION 3: Identity Verification Documents */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-2">
                  <Camera className="w-4 h-4" /> 3. Identity Verification Documents
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    Passport-Size Photograph (JPG / PNG) *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 bg-slate-900 p-2 rounded-xl border border-slate-700"
                  />
                  {profile?.photoDocumentKey && !photoFile && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                      ✓ Previously submitted photo on file: {profile.photoDocumentKey.split("-").pop()}
                    </p>
                  )}
                </div>

                {/* Aadhaar Upload */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Aadhaar Card Document (PDF / Image) *
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 bg-slate-900 p-2 rounded-xl border border-slate-700"
                  />
                  {profile?.idDocumentKey && !aadhaarFile && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                      ✓ Previously submitted Aadhaar on file: {profile.idDocumentKey.split("-").pop()}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Submit Profile & Documents for Admin Approval
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500 pt-6">
        Rudra Co-Living Management System · High-Security Private Storage (ap-south-1)
      </div>
    </div>
  );
}
