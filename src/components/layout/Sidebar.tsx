"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Bed,
  Users,
  ShieldCheck,
  CreditCard,
  Zap,
  Receipt,
  Wrench,
  Bell,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  User,
  X,
} from "lucide-react";
import { clsx } from "clsx";

interface SidebarProps {
  role: "admin" | "resident";
  counts?: {
    approvals?: number;
    issues?: number;
    payments?: number;
    messages?: number;
  };
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
}

export function Sidebar({ role, counts, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const adminNav: NavItem[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Floor & Beds", href: "/admin/beds", icon: Bed },
    { label: "Residents", href: "/admin/residents", icon: Users },
    {
      label: "Approvals",
      href: "/admin/approvals",
      icon: ShieldCheck,
      badge: counts?.approvals,
    },
    {
      label: "Rent Payments",
      href: "/admin/payments",
      icon: CreditCard,
      badge: counts?.payments,
    },
    { label: "Urjavi Electricity", href: "/admin/electricity", icon: Zap },
    { label: "Expenses", href: "/admin/expenses", icon: Receipt },
    {
      label: "Maintenance Issues",
      href: "/admin/issues",
      icon: Wrench,
      badge: counts?.issues,
    },
    { label: "Notices", href: "/admin/notices", icon: Bell },
    {
      label: "Messenger",
      href: "/admin/messages",
      icon: MessageSquare,
      badge: counts?.messages,
    },
    { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const residentNav: NavItem[] = [
    { label: "Dashboard", href: "/resident", icon: Home },
    { label: "My Room & Bed", href: "/resident/room", icon: Bed },
    { label: "Rent & Payments", href: "/resident/payments", icon: CreditCard },
    { label: "Maintenance Issues", href: "/resident/issues", icon: Wrench },
    { label: "Notices", href: "/resident/notices", icon: Bell },
    {
      label: "Messenger",
      href: "/resident/messages",
      icon: MessageSquare,
      badge: counts?.messages,
    },
    { label: "My Profile", href: "/resident/profile", icon: User },
  ];

  const navItems = role === "admin" ? adminNav : residentNav;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = role === "admin" ? "/admin/login" : "/login";
  };

  const renderContent = (isMobile: boolean) => (
    <>
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link
            href={role === "admin" ? "/admin" : "/resident"}
            className="flex items-center gap-3"
            onClick={() => isMobile && onMobileClose?.()}
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-amber-500/40 shrink-0 gold-glow bg-slate-900">
              <Image
                src="/images/logo.png"
                alt="Rudra Co-Living Emblem"
                fill
                className="object-cover"
                priority
              />
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-wider text-amber-400 uppercase font-sans">
                  Rudra Co-Living
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {role === "admin" ? "Property Admin Portal" : "Resident Portal"}
                </span>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              onClick={onMobileClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && item.href !== "/resident" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && onMobileClose?.()}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={clsx(
                      "w-5 h-5 shrink-0 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-amber-400"
                    )}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                {(!collapsed || isMobile) && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold shadow-xs">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-600/20 border border-transparent hover:border-rose-500/40 transition-all cursor-pointer",
            collapsed && !isMobile && "justify-center"
          )}
          title="Logout"
        >
          <LogOut className="w-5 h-5 shrink-0 text-rose-400" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible from md up) */}
      <aside
        className={clsx(
          "hidden md:flex bg-[#0B132B] text-slate-300 flex-col justify-between transition-all duration-300 ease-in-out border-r border-slate-800 z-30 select-none sticky top-0 h-screen shrink-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop (screens < md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0B132B] text-slate-300 flex flex-col justify-between h-full shadow-2xl z-10 border-r border-slate-800 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
