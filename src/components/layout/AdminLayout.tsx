"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useRouter } from "next/navigation";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    name: string;
    role: string;
    mobile: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{
    approvals?: number;
    issues?: number;
    payments?: number;
    messages?: number;
  }>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (!data.authenticated || data.user.role !== "admin") {
          router.replace("/admin/login");
        } else {
          setUser(data.user);
          // Fetch badge counts
          fetch("/api/admin/dashboard")
            .then((r) => r.json())
            .then((dash) => {
              if (dash.summary) {
                setCounts((prev) => ({
                  ...prev,
                  approvals: dash.summary.pendingDocumentApprovals,
                  payments: dash.summary.pendingPaymentApprovals,
                  issues: dash.summary.openMaintenanceIssues,
                  messages: dash.summary.unreadMessages,
                }));
              }
            })
            .catch(console.error);

          // Periodic unread messages count sync
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
          const interval = setInterval(fetchUnread, 15000);
          return () => clearInterval(interval);
        }
      })
      .catch(() => {
        router.replace("/admin/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Rudra Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 w-full overflow-x-hidden">
      <Sidebar
        role="admin"
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
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
