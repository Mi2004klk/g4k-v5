"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send, Users, User, Clock } from "lucide-react";

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/chat/conversations", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.data);
          if (data.data.length > 0) setActiveConv(data.data[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${activeConv.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data);
      }
    };
    fetchMessages();
    // Simulate real-time polling
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeConv]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;

    const token = localStorage.getItem("token");
    // Optimistic UI update
    const tempMsg = { id: Date.now(), body: input, sender_name: "You", created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setInput("");

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${activeConv.id}/messages`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body: tempMsg.body })
      });
    } catch (e) {
      toast.error("Message queued for offline sync");
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 pb-6">
      <div className="w-full md:w-80 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[400px] md:h-auto">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/80">
          <h2 className="font-semibold text-white">Channels & DMs</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-4 text-center text-zinc-500 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">No conversations found.</div>
          ) : conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveConv(c)}
              className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeConv?.id === c.id ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {c.type === 'direct' ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              <div>
                <div className="font-medium">{c.name || "Global Chat"}</div>
                <div className="text-[10px] uppercase tracking-wide opacity-50">{c.type}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[500px] md:h-auto">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                {activeConv.type === 'direct' ? <User className="w-4 h-4 text-zinc-500" /> : <Users className="w-4 h-4 text-zinc-500" />}
                {activeConv.name || "Global Chat"}
              </h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.sender_name === "You" ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-300">{m.sender_name}</span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(m.created_at), 'HH:mm')}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                    m.sender_name === "You" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                  }`}>
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 text-white outline-none focus:border-indigo-500"
                />
                <Button type="submit" size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-500 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2">
            <Users className="w-12 h-12 opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
