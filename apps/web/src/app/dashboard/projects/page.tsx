"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Folder, Plus, ArrowRight } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple state for creating project
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/projects", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        toast.success("Project created");
        setShowCreate(false);
        setName("");
        setDescription("");
        fetchProjects();
      } else {
        toast.error("Failed to create. You might not have permission.");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Projects</h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Project</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project Name</label>
              <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 h-24 resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-zinc-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-zinc-500">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="group block bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Folder className="w-6 h-6 text-indigo-400" />
                </div>
                <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
              <p className="text-sm text-zinc-400 line-clamp-2 mb-6">{p.description || "No description provided."}</p>
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>{format(new Date(p.created_at), 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">Board <ArrowRight className="w-4 h-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
