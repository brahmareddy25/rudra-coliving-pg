"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Utensils,
  Home,
  Wifi,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  Lock,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-500/50 gold-glow bg-slate-900">
              <Image
                src="/images/logo.png"
                alt="Rudra Co-Living Emblem"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="font-black text-lg tracking-wider text-amber-400 uppercase">
                Rudra Co-Living
              </span>
              <p className="text-[11px] text-emerald-400 font-medium">
                Live · Connect · Thrive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-1.5"
            >
              Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Welcome to Your Home Away From Home</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Co-Living That Truly <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300">
              Feels Just Like Home
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Experience the comfort of wholesome, home-style food, restful living spaces, and a warm, supportive community. At Rudra Co-Living, you enjoy peaceful hospitality and personalized care every single day.
          </p>

          <div className="pt-2 flex justify-center lg:justify-start">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-950/60 transition-all flex items-center gap-2 text-base"
            >
              <Lock className="w-4 h-4 text-amber-300" />
              Login
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Homely Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Fresh Home-Cooked Food</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Comfortable & Peaceful Stay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>24/7 Caring Support</span>
            </div>
          </div>
        </div>

        {/* Hero Image / Emblem Visual */}
        <div className="flex-1 flex justify-center relative">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl gold-glow bg-slate-900 p-3">
            <Image
              src="/images/logo.png"
              alt="Rudra Co-Living Sacred Emblem"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </main>

      {/* Feature Pillars: Emphasizing Home, Food & Stay */}
      <section className="border-t border-slate-800/80 bg-slate-900/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Home-Style Food</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Wholesome, hygienic meals prepared fresh daily with quality ingredients that taste just like home.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Comfortable Stay</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quiet, well-maintained rooms with regular housekeeping, fresh linen, and a tranquil atmosphere to relax.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Modern Conveniences</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-speed Wi-Fi, power backup, hot water, RO drinking water, and seamless digital rent management.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Warm Community</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A respectful, friendly environment where fellow residents and management look out for one another.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Rudra Co-Living. Live. Connect. Thrive. All rights reserved.</p>
      </footer>
    </div>
  );
}
