"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { usePublicConfig } from "@/lib/use-public-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { data: config } = usePublicConfig();
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token && !user) {
      router.replace("/login");
    }
  }, [token, user, router]);

  async function handleFinish() {
    setIsLoading(true);
    try {
      const res = await apiFetch("/auth/onboarding/complete", {
        method: "POST",
      });

      if (user && token) {
        const updatedUser = res.user || { ...user, onboarded_at: new Date().toISOString() };
        setAuth(token, updatedUser, user.active_role || user.roles?.[0] || 'employee');
      }

      toast.success("Welcome aboard!");
      if (user?.roles && user.roles.length > 1) {
          router.push("/role-select");
      } else {
          router.push("/dashboard");
      }
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || "Could not complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <div className="flex space-x-1.5 items-center justify-center">
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const primaryRole = user.roles?.[0] || 'employee';

  return (
    <div className="h-full min-h-screen flex items-center justify-center p-4 bg-transparent font-sans">
      <Card className="w-full max-w-md shadow-e1 hover:shadow-e2 transition-shadow duration-150 border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-card dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full relative flex flex-col items-center justify-center pt-8 pb-4">
           {/* Replace gradient hero with the animated logo */}
           <video 
              src="/animated-logo.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-32 h-32 object-contain"
           />
        </div>

        <CardHeader className="text-center space-y-2 pb-6 pt-2">
          <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
            Welcome to {config?.name || "Games4King"}
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            We are excited to have you on board!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Name</div>
                  <div className="font-medium text-neutral-900 dark:text-white truncate" title={user.name}>{user.name}</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Emp ID</div>
                  <div className="font-medium text-neutral-900 dark:text-white">{user.employee_id || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Primary Role</div>
                  <div className="font-medium text-neutral-900 dark:text-white capitalize">{primaryRole.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Department</div>
                  <div className="font-medium text-neutral-900 dark:text-white truncate" title={(user as any).department?.name}>
                    {(user as any).department?.name || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleFinish}
              disabled={isLoading}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 hover:shadow-e2 transition-shadow duration-150 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <div className="flex space-x-1.5 items-center justify-center h-full">
                    <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  "Get Started"
                )}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
