"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Megaphone, Pin, Plus } from "lucide-react";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/announcements", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/announcements", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, body, is_pinned: isPinned })
      });
      if (res.ok) {
        toast.success("Announcement posted");
        setShowForm(false);
        setTitle("");
        setBody("");
        setIsPinned(false);
        fetchAnnouncements();
      } else {
        toast.error("Failed to post. Check capabilities.");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-indigo-400" />
          Company Feed
        </h1>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Post Update
        </Button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Title</label>
              <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Message</label>
              <textarea required value={body} onChange={e=>setBody(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 h-32 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pin" checked={isPinned} onChange={e=>setIsPinned(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-600" />
              <label htmlFor="pin" className="text-sm text-zinc-300">Pin to top</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Post Announcement</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-zinc-500 py-12">Loading feed...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-zinc-500 py-12 border border-zinc-800 border-dashed rounded-xl">No announcements yet.</div>
        ) : announcements.map(a => (
          <div key={a.id} className={`bg-zinc-900 border rounded-xl p-6 relative ${a.is_pinned ? 'border-indigo-500/50' : 'border-zinc-800'}`}>
            {a.is_pinned && (
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-zinc-950 px-2 flex items-center gap-1 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                <Pin className="w-3 h-3" /> Pinned
              </div>
            )}
            <h2 className="text-xl font-bold text-white mb-2">{a.title}</h2>
            <div className="text-sm text-zinc-400 mb-6 flex items-center gap-2">
              <span className="font-medium text-zinc-300">{a.author_name}</span>
              <span>•</span>
              <span>{format(new Date(a.created_at), 'MMMM d, yyyy h:mm a')}</span>
            </div>
            <p className="text-zinc-300 whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
