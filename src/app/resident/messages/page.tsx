"use client";

import React, { useState, useEffect, useRef } from "react";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import { MessageSquare, Send, Shield, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";

export default function ResidentMessagesPage() {
  const [convo, setConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChat = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversation) {
        setConvo(data.conversation);
        const msgRes = await fetch(`/api/conversations/${data.conversation._id}/messages`);
        const msgData = await msgRes.json();
        if (msgData.messages) {
          setMessages(msgData.messages);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !convo) return;

    const textToSend = inputText.trim();
    saveRecentItem("resident_messages_text", textToSend);
    setInputText("");
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${convo._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });
      const data = await res.json();
      if (data.success) {
        fetchChat();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <ResidentLayout title="Direct Chat with Management">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)] flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/40">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Rudra Property Management Office
              </h3>
              <p className="text-xs text-slate-500">
                Direct private channel for inquiries, requests, and stay assistance.
              </p>
            </div>
          </div>

          <button
            onClick={fetchChat}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/20">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No previous messages. Start a conversation with property management below.
            </div>
          ) : (
            messages.map((m) => {
              const isResident = m.senderRole === "resident";
              return (
                <div
                  key={m._id}
                  className={clsx("flex flex-col", isResident ? "items-end" : "items-start")}
                >
                  <div
                    className={clsx(
                      "max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs",
                      isResident
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

        {/* Send Input */}
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 flex items-center gap-2 bg-white">
          <RecentInput
            storageKey="resident_messages_text"
            type="text"
            placeholder="Type your message to management..."
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
      </div>
    </ResidentLayout>
  );
}
