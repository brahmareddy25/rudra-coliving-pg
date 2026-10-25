"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, ShieldAlert, Mail, Phone, KeyRound } from "lucide-react";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "password">("phone");
  const [identifier, setIdentifier] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resolvedMobile, setResolvedMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOtpBlocked, setIsOtpBlocked] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 || data.otpBlocked) {
          setIsOtpBlocked(true);
        }
        throw new Error(data.error || "Failed to send OTP");
      }

      setIsOtpBlocked(false);
      if (identifier) saveRecentItem("forgot_password_identifier", identifier);

      setSuccess(data.message);
      if (data.maskedEmail) setMaskedEmail(data.maskedEmail);
      if (data.mobile) setResolvedMobile(data.mobile);

      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: resolvedMobile || identifier,
          identifier,
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 || data.otpBlocked) {
          setIsOtpBlocked(true);
        }
        throw new Error(data.error || "Verification failed");
      }

      setIsOtpBlocked(false);
      setSuccess(data.message);
      setStep("password");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: resolvedMobile || identifier,
          identifier,
          otp,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 || data.otpBlocked) {
          setIsOtpBlocked(true);
        }
        throw new Error(data.error || "Reset failed");
      }

      setIsOtpBlocked(false);
      setSuccess(data.message);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex flex-col items-center">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-xl gold-glow bg-slate-900 mb-2">
            <Image
              src="/images/logo.png"
              alt="Rudra Co-Living Emblem"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h2 className="text-2xl font-black text-amber-400 tracking-wider uppercase">
            Rudra Co-Living
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Email OTP Password Recovery
          </p>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/95 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {/* OTP Stopped Lockout Banner */}
          {isOtpBlocked && (
            <div className="mb-5 p-4 bg-rose-950/80 border-2 border-rose-600 rounded-xl text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                OTP Service Stopped
              </div>
              <p className="leading-relaxed">
                OTP services have been stopped for this resident account due to multiple failed verification attempts.
              </p>
              <div className="pt-2 border-t border-rose-800/80 font-bold text-rose-300 flex items-center justify-between">
                <span>Please contact Property Administration to restart your OTP service.</span>
              </div>
            </div>
          )}

          {error && !isOtpBlocked && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}


          {/* Step 1: Enter Mobile or Email */}
          {step === "phone" && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Registered Mobile Number or Email ID
                </label>
                <div className="relative">
                  <RecentInput
                    storageKey="forgot_password_identifier"
                    type="text"
                    placeholder="Enter 10-digit mobile or personal email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  A 6-digit verification code will be sent to your mandatory registered email ID.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || isOtpBlocked}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Sending Email OTP..." : "Request Email Verification Code"}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Enter 6-Digit Email OTP
                </label>
                {maskedEmail && (
                  <p className="text-xs text-emerald-400 font-mono mb-2">
                    Code delivered to: <strong>{maskedEmail}</strong>
                  </p>
                )}
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  disabled={isOtpBlocked}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white text-center tracking-widest font-mono text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || isOtpBlocked}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code & Proceed"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Change Email or Mobile Number
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Set New Password */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Set New Password"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Remember your credentials?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
