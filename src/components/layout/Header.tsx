"use client";

import React, { useState, useEffect } from "react";
import { Bell, Menu, X, User, Check, Shield, MessageSquare, LogOut } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface HeaderProps {
  title: string;
  user: {
    id: string;
    name: string;
    role: string;
    mobile: string;
    avatarUrl?: string;
  };
  onMenuToggle?: () => void;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function Header({ title, user, onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const res = await fetch("/api/conversations/unread");
      const data = await res.json();
      if (typeof data.unreadCount === "number") {
        setUnreadMessagesCount(data.unreadCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadMessages();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadMessages();
    }, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = user.role === "admin" ? "/admin/login" : "/login";
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-[150px] sm:max-w-md">
          {title}
        </h1>
      </div>

      {/* Right: Notifications, Messenger & User Profile & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Messenger Quick Access with Top-Right Badge */}
        <Link
          href={user.role === "admin" ? "/admin/messages" : "/resident/messages"}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Messenger"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </span>
          )}
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n._id}
                      href={n.link || "#"}
                      onClick={() => setShowNotifications(false)}
                      className={clsx(
                        "block p-3.5 hover:bg-slate-50 transition-colors",
                        !n.isRead && "bg-emerald-50/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm flex items-center justify-center border border-emerald-300 shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{user.name}</span>
            <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
          </div>
        </div>

        {/* Explicit Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all cursor-pointer shadow-2xs shrink-0"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
