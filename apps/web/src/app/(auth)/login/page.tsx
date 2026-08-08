"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOfflineEngine } from "@/lib/offline-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { isOffline, queueLogin } = useOfflineEngine();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (isOffline) {
      queueLogin(identifier, password);
      setError("You are offline. Login attempt queued.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, device_name: "Web Browser" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      // Store token
      localStorage.setItem("token", data.token);

      if (data.user.must_change_password) {
        router.push("/change-password");
      } else if (!data.user.onboarded_at) {
        router.push("/onboarding");
      } else if (data.user.roles.length > 1) {
        router.push("/role-select");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <img src="/landscape-logo.png" alt="Games4King" className="h-12 object-contain" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription className="text-zinc-400">
                Enter your email or employee ID to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded bg-red-900/50 border border-red-900 text-red-200">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="identifier">Email / Employee ID</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="EMP-001 or name@games4king.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="/forgot-password" className="text-xs text-zinc-400 hover:text-white">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="flex flex-col items-center text-xs text-zinc-500">
          <p>© Games4King Workplace OS</p>
          <p className="mt-1" title="Gen2k Conglomerate (2018) • Milestone 1">
            v1.0 Milestone 1
          </p>
        </div>
      </div>
    </div>
  );
}
