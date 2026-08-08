"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = {
  name: string;
  phone: string;
  avatar_url: string;
  email: string;
  employee_id: string;
  department: { name: string } | null;
  designation: { name: string } | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/profile", {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, phone, avatar_url: avatarUrl })
      });
      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!profile) return <div className="p-8 text-white">Error loading profile</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 text-white">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 text-zinc-400">
          <div>
            <p className="text-sm font-semibold text-zinc-500">Employee ID</p>
            <p className="text-lg text-white">{profile.employee_id}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500">Email</p>
            <p className="text-lg text-white">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500">Department</p>
            <p className="text-lg text-white">{profile.department?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500">Designation</p>
            <p className="text-lg text-white">{profile.designation?.name || "N/A"}</p>
          </div>
        </div>

        <div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input 
                id="avatarUrl" 
                type="url"
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)} 
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
