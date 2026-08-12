"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { User, Shield, Briefcase, ChevronRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";

export default function RoleSelectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const autoSelectedRef = useState({ done: false })[0];

  useEffect(() => {
    if (user && user.roles && user.roles.length === 1 && !autoSelectedRef.done) {
      autoSelectedRef.done = true;
      handleSelectRole(user.roles[0]);
    }
  }, [user?.id, user?.roles?.length]);

  async function handleSelectRole(role: string) {
    setIsLoading(role);
    try {
      await apiFetch("/auth/role-select", {
        method: "POST",
        body: JSON.stringify({ role }),
      });

      // Silently refresh to get new active_role token
      if (token) {
         try {
            const result = await apiFetch("/auth/refresh");
            setAuth(result.token, result.user, result.active_role, result.refresh_token);
            router.push("/dashboard");
         } catch {
            router.push("/dashboard");
         }
      } else {
         router.push("/dashboard");
      }
    } catch (error: any) {
      if (error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(error.message || "Failed to select role.");
      }
    } finally {
      setIsLoading(null);
    }
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "super_admin":
        return { icon: Shield, title: "Super Admin", desc: "Full system access" };
      case "hr":
        return { icon: Briefcase, title: "HR Manager", desc: "Manage employees & attendance" };
      case "employee":
      default:
        return { icon: User, title: "Employee", desc: "Access your personal workspace" };
    }
  };

  if (!user || !user.roles || user.roles.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950">
        <div className="flex space-x-1.5 items-center justify-center">
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (user.roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950 font-sans">
        <Card className="w-full max-w-md shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 text-center bg-white dark:bg-neutral-900 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold font-display text-neutral-900 dark:text-white">No Workspace Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-sans text-neutral-500 dark:text-neutral-400 mb-6 mt-2">
              Your account currently has no roles assigned. Please contact your administrator.
            </p>
            <button 
              onClick={() => { setAuth(null, null, null, null); router.push('/login'); }} 
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg shadow-sm transition-all font-sans"
            >
              Sign out
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950 font-sans">
      <Card className="w-full max-w-md shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full h-28 bg-gradient-brand relative flex items-center justify-center pt-2 pb-2">
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
            const Icon = info.icon;
            
            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                disabled={isLoading !== null}
                className="w-full flex items-center p-4 text-left border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-brand-violet dark:hover:border-brand-violet hover:bg-brand-violet/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-neutral-900 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-brand-violet/10 flex items-center justify-center mr-4 shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-brand-violet" />
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
                  <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-brand-violet transition-colors shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
