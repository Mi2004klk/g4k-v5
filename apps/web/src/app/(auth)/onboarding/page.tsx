"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error);
  }, [router]);

  const completeOnboarding = () => {
    // In a real application, you might submit a form here to set onboarded_at
    if (user && user.roles.length > 1) {
      router.push("/role-select");
    } else {
      router.push("/dashboard");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-lg space-y-8">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl">Welcome to Games4King Workplace OS</CardTitle>
            <CardDescription className="text-zinc-400">
              Hi {user.name}, we're excited to have you on board!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-zinc-300">
              Your account has been successfully set up. You can now access your dashboard and manage your profile.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={completeOnboarding}
            >
              Get Started
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
