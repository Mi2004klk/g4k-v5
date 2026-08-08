"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password, password_confirmation: passwordConfirmation }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      router.push("/login?reset=success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset}>
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm rounded bg-red-900/50 border border-red-900 text-red-200">
            {error}
          </div>
        )}
        
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
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
      </CardFooter>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl">
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
