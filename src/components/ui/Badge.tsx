import React from "react";
import { clsx } from "clsx";

export type BadgeVariant =
  | "available"
  | "occupied"
  | "reserved"
  | "maintenance"
  | "paid"
  | "pending"
  | "overdue"
  | "partially_paid"
  | "open"
  | "working_on_it"
  | "waiting"
  | "resolved"
  | "closed"
  | "default"
  | "gold";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = "default", children, className, dot = true }: BadgeProps) {
  const styles: Record<BadgeVariant, { bg: string; text: string; dotColor: string }> = {
    available: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dotColor: "bg-emerald-500" },
    occupied: { bg: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700", dotColor: "bg-blue-500" },
    reserved: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", dotColor: "bg-amber-500" },
    maintenance: { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "text-rose-700", dotColor: "bg-rose-500" },
    paid: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dotColor: "bg-emerald-500" },
    pending: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", dotColor: "bg-amber-500" },
    overdue: { bg: "bg-red-50 text-red-700 border-red-200", text: "text-red-700", dotColor: "bg-red-500" },
    partially_paid: { bg: "bg-sky-50 text-sky-700 border-sky-200", text: "text-sky-700", dotColor: "bg-sky-500" },
    open: { bg: "bg-orange-50 text-orange-700 border-orange-200", text: "text-orange-700", dotColor: "bg-orange-500" },
    working_on_it: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", text: "text-indigo-700", dotColor: "bg-indigo-500" },
    waiting: { bg: "bg-purple-50 text-purple-700 border-purple-200", text: "text-purple-700", dotColor: "bg-purple-500" },
    resolved: { bg: "bg-teal-50 text-teal-700 border-teal-200", text: "text-teal-700", dotColor: "bg-teal-500" },
    closed: { bg: "bg-slate-100 text-slate-700 border-slate-200", text: "text-slate-700", dotColor: "bg-slate-400" },
    gold: { bg: "bg-amber-50 text-amber-800 border-amber-300", text: "text-amber-800", dotColor: "bg-amber-500" },
    default: { bg: "bg-slate-100 text-slate-700 border-slate-200", text: "text-slate-700", dotColor: "bg-slate-400" },
  };

  const style = styles[variant] || styles.default;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        style.bg,
        className
      )}
    >
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", style.dotColor)} />}
      {children}
    </span>
  );
}
