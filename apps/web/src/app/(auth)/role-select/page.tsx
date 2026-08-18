"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { AppIcon, IconName } from "@g4k/ui/components";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";

export default function RoleSelectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const token = useAuthStore((s) => s.token);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const autoSelectedRef = useRef(false);

  const handleSelectRole = useCallback(async (role: string) => {
    setIsLoading(role);
    try {
      const data = await apiFetch("/auth/role-select", {
        method: "POST",
        body: JSON.stringify({ role }),
      });

      setAuth(data.token, data.user, data.active_role, data.refresh_token, data.capabilities);
      queryClient.setQueryData(queryKeys.capabilities(), data.capabilities);
      router.push("/dashboard");
    } catch (error) {
      const e = error as { status?: number; message?: string };
      if (e.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(e.message || "Failed to select role.");
      }
    } finally {
      setIsLoading(null);
    }
  }, [setAuth, queryClient, router]);

  useEffect(() => {
    if (!token && !user) {
      router.replace("/login");
      return;
    }
    if (user && user.roles && user.roles.length === 1 && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      handleSelectRole(user.roles[0]);
    }
  }, [token, user, autoSelectedRef, handleSelectRole, router]);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "super_admin":
        return { icon: "shield", title: "Super Admin", desc: "Full system access" };
      case "hr":
        return { icon: "briefcase", title: "HR Manager", desc: "Manage employees & attendance" };
      case "employee":
      default:
        return { icon: "profile", title: "Employee", desc: "Access your personal workspace" };
    }
  };

  if (!user || (user.roles && user.roles.length === 1)) {
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

  if (!user.roles || user.roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent font-sans">
        <Card className="w-full max-w-md shadow-e1 hover:shadow-e2 transition-shadow duration-150 border border-neutral-200 dark:border-neutral-800 p-6 text-center bg-card dark:bg-neutral-900 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold font-display text-neutral-900 dark:text-white">No Workspace Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-sans text-neutral-500 dark:text-neutral-400 mb-6 mt-2">
              Your account currently has no roles assigned. Please contact your administrator.
            </p>
            <button 
              onClick={() => { clearAuth(); router.push('/login'); }} 
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-[var(--radius)] shadow-e1 hover:shadow-e2 transition-shadow duration-150 transition-all font-sans"
            >
              Sign out
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen flex items-center justify-center p-4 bg-transparent font-sans">
      <Card className="w-full max-w-md shadow-e1 hover:shadow-e2 transition-shadow duration-150 border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-card dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full h-28 bg-primary relative flex items-center justify-center pt-2 pb-2">
           <Image
              src="/landscape-logo.png"
              alt="Games4King Logo"
              width={200}
              height={80}
              priority
              className="object-contain max-h-[80px]"
            />
        </div>

        <CardHeader className="space-y-2 pb-6 pt-6 text-center">
          <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
            Select Workspace
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            Choose which role you want to continue as
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pb-8">
          {user.roles.map((role: string) => {
            const info = getRoleInfo(role);
            
            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                disabled={isLoading !== null}
                className="w-full flex items-center p-4 text-left border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-brand-violet dark:hover:border-brand-violet hover:bg-brand-violet/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed bg-card dark:bg-neutral-900 shadow-e1 hover:shadow-e2 transition-shadow duration-150"
              >
                <div className="w-10 h-10 rounded-full bg-brand-violet/10 flex items-center justify-center mr-4 shrink-0 group-hover:scale-110 transition-transform">
                  <AppIcon name={info.icon as IconName} className="w-5 h-5 text-brand-violet" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm font-sans">{info.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">{info.desc}</p>
                </div>
                {isLoading === role ? (
                  <div className="flex space-x-1 shrink-0 ml-2">
                    <div className="w-1.5 h-1.5 bg-brand-violet rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand-violet rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand-violet rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <AppIcon name="chevronRight" size="lg" className=" text-neutral-300 dark:text-neutral-600 group-hover:text-brand-violet transition-colors shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
