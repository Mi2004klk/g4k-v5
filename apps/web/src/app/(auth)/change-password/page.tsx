"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: passwordConfirmation }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to change password.");
      }

      router.push("/onboarding"); // After force password change, usually onboard
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl">
          <form onSubmit={handleChangePassword}>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription className="text-zinc-400">
                You are required to change your password before continuing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded bg-red-900/50 border border-red-900 text-red-200">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">Confirm New Password</Label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
