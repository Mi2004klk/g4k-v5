"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoleSelectPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // In a real implementation, we would get the user from a Context/Zustand store.
    // For now we'll fetch `/api/auth/me` to get roles.
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.roles) {
          setRoles(data.user.roles);
        } else {
          router.push("/login");
        }
      })
      .catch((err) => {
        console.error(err);
        router.push("/login");
      });
  }, [router]);

  const selectRole = async (role: string) => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/role/select", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to select role.");
      }

      localStorage.setItem("token", data.token); // Store the new role-bound token
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (roles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-white">
        Loading roles...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl">
          <CardHeader>
            <CardTitle>Select Role</CardTitle>
            <CardDescription className="text-zinc-400">
              You have multiple roles. Select the one you want to use for this session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded bg-red-900/50 border border-red-900 text-red-200">
                {error}
              </div>
            )}
            
            <div className="grid gap-4">
              {roles.map((role) => (
                <Button 
                  key={role} 
                  variant="outline" 
                  className="w-full justify-start text-left uppercase border-zinc-700 hover:bg-zinc-800"
                  onClick={() => selectRole(role)}
                  disabled={isLoading}
                >
                  Log in as {role.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
