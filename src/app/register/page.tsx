"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Key, UserCheck, PhoneCall, Home } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex flex-col items-center">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-xl gold-glow bg-slate-900 mb-3">
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
            Resident Onboarding & Admissions
          </p>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-slate-900/95 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10 text-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-950 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-1">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Direct Bed Allocation by Administration
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              To guarantee seamless visual bed assignments and room matching, public self-registration is disabled. Room admissions and accounts are created directly by the property management.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Key className="w-4 h-4" /> How to get started:
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-300">
                  <strong className="text-white">Provide Name & Phone:</strong> Share your full name and 10-digit mobile number with the property manager upon visiting or inquiring.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-300">
                  <strong className="text-white">Bed Allocated & Temporary Password:</strong> Management allocates your bed in your chosen room and provides your secure temporary password.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-300">
                  <strong className="text-white">Login & Mandatory 2 Steps:</strong> Sign in with your mobile & temporary password. You will update your private password and upload your photo & Aadhaar for admin verification.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/login"
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Sign In with Assigned Password <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
