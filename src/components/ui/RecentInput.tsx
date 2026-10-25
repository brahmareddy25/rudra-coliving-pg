"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, X, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

const MAX_RECENT_ITEMS = 10;

/**
 * Utility to save a value to the top of the recent 10 items in localStorage
 */
export function saveRecentItem(storageKey: string, value: string) {
  if (typeof window === "undefined" || !storageKey || !value) return;
  const clean = value.trim();
  if (!clean) return;

  try {
    const key = `rudra_recent_${storageKey}`;
    const raw = localStorage.getItem(key);
    let items: string[] = raw ? JSON.parse(raw) : [];

    // Filter out duplicates (case-insensitive deduplication)
    items = items.filter((item) => item.toLowerCase() !== clean.toLowerCase());
    // Prepend to top
    items.unshift(clean);
    // Keep max 10
    items = items.slice(0, MAX_RECENT_ITEMS);

    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.warn("[RecentInput] Failed to save recent item:", e);
  }
}

/**
 * Utility to get recent items from localStorage
 */
export function getRecentItems(storageKey: string): string[] {
  if (typeof window === "undefined" || !storageKey) return [];
  try {
    const key = `rudra_recent_${storageKey}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface RecentInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  storageKey: string;
  value: string;
  onSelectRecent?: (value: string) => void;
  label?: string;
  containerClassName?: string;
}

export function RecentInput({
  storageKey,
  value,
  onChange,
  onSelectRecent,
  placeholder,
  className,
  containerClassName,
  disabled,
  type = "text",
  required,
  ...props
}: RecentInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load items on mount and when storageKey changes
  const refreshItems = () => {
    setRecentItems(getRecentItems(storageKey));
  };

  useEffect(() => {
    refreshItems();
  }, [storageKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: { name: props.name || "", value: item },
        currentTarget: { name: props.name || "", value: item },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
    if (onSelectRecent) onSelectRecent(item);
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    try {
      const key = `rudra_recent_${storageKey}`;
      const filtered = recentItems.filter((i) => i !== itemToRemove);
      localStorage.setItem(key, JSON.stringify(filtered));
      setRecentItems(filtered);
    } catch (err) {
      console.warn("[RecentInput] Failed to remove item:", err);
    }
  };

  // Filter items matching current input if user is typing
  const filteredItems = value.trim()
    ? recentItems.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase().trim())
      )
    : recentItems;

  return (
    <div ref={containerRef} className={clsx("relative w-full", containerClassName)}>
      <div className="relative flex items-center">
        <input
          type={type}
          value={value}
          onChange={(e) => {
            if (onChange) {
              (onChange as any)(e);
            }
            if (!isOpen && recentItems.length > 0) setIsOpen(true);
          }}
          onFocus={() => {
            refreshItems();
            if (recentItems.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={clsx(
            "w-full pr-8",
            className || "p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          )}
          {...props}
        />

        {recentItems.length > 0 && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              refreshItems();
              setIsOpen(!isOpen);
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
            title="Recent items"
          >
            <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Recent items dropdown */}
      {isOpen && recentItems.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs py-1 divide-y divide-slate-100 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-50/80 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-600" /> Recent Entries (Last {recentItems.length})
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click to insert</span>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-slate-400 italic text-[11px]">
                No matching recent items
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  onClick={() => handleSelect(item)}
                  className="px-3 py-2 flex items-center justify-between hover:bg-emerald-50/60 cursor-pointer group transition-colors"
                >
                  <span className="text-slate-800 font-medium truncate pr-2 group-hover:text-emerald-950">
                    {item}
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => handleRemove(e, item)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded transition-all"
                    title="Remove from history"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RecentTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  storageKey: string;
  value: string;
  onSelectRecent?: (value: string) => void;
  containerClassName?: string;
}

export function RecentTextarea({
  storageKey,
  value,
  onChange,
  onSelectRecent,
  placeholder,
  className,
  containerClassName,
  rows = 2,
  disabled,
  ...props
}: RecentTextareaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshItems = () => {
    setRecentItems(getRecentItems(storageKey));
  };

  useEffect(() => {
    refreshItems();
  }, [storageKey]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: { name: props.name || "", value: item },
        currentTarget: { name: props.name || "", value: item },
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    }
    if (onSelectRecent) onSelectRecent(item);
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    try {
      const key = `rudra_recent_${storageKey}`;
      const filtered = recentItems.filter((i) => i !== itemToRemove);
      localStorage.setItem(key, JSON.stringify(filtered));
      setRecentItems(filtered);
    } catch (err) {
      console.warn("[RecentTextarea] Failed to remove item:", err);
    }
  };

  return (
    <div ref={containerRef} className={clsx("relative w-full", containerClassName)}>
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => {
            if (onChange) {
              (onChange as any)(e);
            }
          }}
          onFocus={() => {
            refreshItems();
            if (recentItems.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            "w-full",
            className || "p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          )}
          {...props}
        />

        {recentItems.length > 0 && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              refreshItems();
              setIsOpen(!isOpen);
            }}
            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-1 bg-white/80 rounded"
            title="Recent items"
          >
            <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {isOpen && recentItems.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs py-1 divide-y divide-slate-100 max-h-60 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50/80 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-600" /> Recent Entries (Last {recentItems.length})
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {recentItems.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                onClick={() => handleSelect(item)}
                className="px-3 py-2 flex items-center justify-between hover:bg-emerald-50/60 cursor-pointer group transition-colors"
              >
                <span className="text-slate-800 font-medium truncate pr-2 group-hover:text-emerald-950">
                  {item}
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => handleRemove(e, item)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded transition-all"
                  title="Remove from history"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
