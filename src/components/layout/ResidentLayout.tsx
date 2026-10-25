"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useRouter } from "next/navigation";

interface ResidentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ResidentLayout({ title, children }: ResidentLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    name: string;
    role: string;
    mobile: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState<{
    messages?: number;
  }>({});

  useEffect(() => {
    let interval: any;
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/login");
        } else if (data.user.role === "admin") {
          router.replace("/admin");
        } else if (
          data.user.mustChangePassword ||
          data.user.status === "pending_approval" ||
          data.user.profile?.idVerificationStatus !== "approved"
        ) {
          router.replace("/pending-approval");
        } else {
          setUser(data.user);
          const fetchUnread = () => {
            fetch("/api/conversations/unread")
              .then((r) => r.json())
              .then((d) => {
                if (typeof d.unreadCount === "number") {
                  setCounts((prev) => ({ ...prev, messages: d.unreadCount }));
                }
              })
              .catch(console.error);
          };
          fetchUnread();
          interval = setInterval(fetchUnread, 15000);
        }
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => setLoading(false));

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Resident Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 w-full overflow-x-hidden">
      <Sidebar
        role="resident"
        counts={counts}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header
          title={title}
          user={user}
          onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
