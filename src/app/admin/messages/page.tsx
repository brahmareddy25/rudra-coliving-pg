"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MessageSquare, Send, User, Bed, Search, Paperclip, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (!activeConvoId && data.conversations.length > 0) {
          setActiveConvoId(data.conversations[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convoId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convoId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConvoId) {
      fetchMessages(activeConvoId);
    }
  }, [activeConvoId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvoId) return;

    const textToSend = inputText.trim();
    saveRecentItem("admin_messages_text", textToSend);
    setInputText("");
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${activeConvoId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMessages(activeConvoId);
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.residentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.residentId?.mobile?.includes(search)
  );

  const activeConvo = conversations.find((c) => c._id === activeConvoId);

  return (
    <AdminLayout title="Resident Private Messaging">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)] flex flex-col md:flex-row">
        {/* Left: Conversations Directory */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <RecentInput
                storageKey="admin_messages_search"
                type="text"
                placeholder="Search resident chat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active resident conversations found.
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isSelected = convo._id === activeConvoId;
                return (
                  <div
                    key={convo._id}
                    onClick={() => setActiveConvoId(convo._id)}
                    className={clsx(
                      "p-3.5 cursor-pointer transition-colors flex items-start gap-3",
                      isSelected ? "bg-emerald-50/80 border-l-4 border-emerald-600" : "hover:bg-slate-100/60"
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-sm">
                      {convo.residentId?.name?.charAt(0) || "R"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {convo.residentId?.name || "Resident"}
                        </span>
                        {convo.unreadCountAdmin > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {convo.unreadCountAdmin}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                        {convo.bedNumber ? (
                          <span className="text-blue-700 font-semibold">Bed {convo.bedNumber}</span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {convo.lastMessageText || "Start conversation..."}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Panel */}
        <div className="flex-1 flex flex-col justify-between bg-white">
          {activeConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {activeConvo.residentId?.name?.charAt(0) || "R"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {activeConvo.residentId?.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      +91 {activeConvo.residentId?.mobile}
                      {activeConvo.bedNumber && ` · Bed ${activeConvo.bedNumber}`}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/residents/${activeConvo.residentId?._id}`}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  View Full Profile
                </Link>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/20">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No messages yet. Send a greeting to the resident below.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.senderRole === "admin";
                    return (
                      <div
                        key={m._id}
                        className={clsx("flex flex-col", isAdmin ? "items-end" : "items-start")}
                      >
                        <div
                          className={clsx(
                            "max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs",
                            isAdmin
                              ? "bg-emerald-600 text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 flex items-center gap-2 bg-white">
                <RecentInput
                  storageKey="admin_messages_text"
                  type="text"
                  placeholder="Type a message to resident..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
