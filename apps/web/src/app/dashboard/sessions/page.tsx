"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Session {
  id: number;
  device_name: string;
  ip_address: string;
  last_used_at: string;
  is_current: boolean;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/sessions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeSession = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/auth/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const logoutCurrent = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL + `/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem("token");
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center text-white">
        <div>
          <h1 className="text-3xl font-bold">Active Sessions</h1>
          <p className="text-zinc-400">Manage your logged-in devices</p>
        </div>
        <Button variant="destructive" onClick={logoutCurrent}>
          Log out (Current Device)
        </Button>
      </div>

      {isLoading ? (
        <div className="text-white">Loading sessions...</div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <CardHeader className="pb-4">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>
                    {session.device_name} 
                    {session.is_current && <span className="ml-2 text-xs bg-indigo-600 px-2 py-1 rounded text-white font-normal">Current Device</span>}
                  </span>
                  {!session.is_current && (
                    <Button variant="outline" size="sm" onClick={() => revokeSession(session.id)} className="border-red-900 text-red-500 hover:bg-red-900 hover:text-white">
                      Revoke Access
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  IP: {session.ip_address || "Unknown"} • Last Active: {session.last_used_at ? new Date(session.last_used_at).toLocaleString() : "Now"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
