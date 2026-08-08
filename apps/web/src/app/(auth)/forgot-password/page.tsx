"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"smtp" | "admin">("smtp");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, channel }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit request.");
      }

      setSuccess(true);
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
          {success ? (
            <div className="p-8 text-center space-y-4">
              <h2 className="text-xl font-semibold">Request Received</h2>
              <p className="text-zinc-400">
                If the account exists, you will receive further instructions via {channel === "smtp" ? "email" : "your administrator"}.
              </p>
              <Button onClick={() => window.location.href = "/login"} className="w-full mt-4">
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequest}>
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription className="text-zinc-400">
                  Select how you want to reset your password.
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
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reset Channel</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 text-sm">
                      <input 
                        type="radio" 
                        name="channel" 
                        value="smtp" 
                        checked={channel === "smtp"} 
                        onChange={() => setChannel("smtp")}
                        className="bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>Email me a link</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input 
                        type="radio" 
                        name="channel" 
                        value="admin" 
                        checked={channel === "admin"} 
                        onChange={() => setChannel("admin")}
                        className="bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>Request Admin approval</span>
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Reset Password"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-zinc-400 hover:text-white"
                  onClick={() => window.location.href = "/login"}
                >
                  Cancel
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
