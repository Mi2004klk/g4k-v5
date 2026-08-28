"use client";

import { useState } from "react";
import { AppIcon, IconName } from "@g4k/ui/components";
import { Card } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProfileWorkspaceSection() {
  const user = useAuthStore((s) => s.user);
  const activeRole = useAuthStore((s) => s.activeRole);
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!user || !user.roles || user.roles.length <= 1) {
    return null; // Only show if user has multiple roles
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "super_admin":
        return { icon: "shield", title: "Super Admin", desc: "Full system access" };
      case "hr":
        return { icon: "briefcase", title: "HR Manager", desc: "Manage employees & attendance" };
      case "employee":
        return { icon: "profile", title: "Employee", desc: "Access your personal workspace" };
      default:
        const formattedTitle = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return { icon: "command", title: formattedTitle, desc: "Access your workspace" };
    }
  };

  const handleSelectRole = async (role: string) => {
    if (role === activeRole) return;
    
    setIsLoading(role);
    try {
      const data = await apiFetch("/auth/role-select", {
        method: "POST",
        body: JSON.stringify({ role }),
      });

      setAuth(data.token, data.user, data.active_role, data.refresh_token, data.capabilities);
      queryClient.clear();
      queryClient.setQueryData(queryKeys.capabilities(), data.capabilities);
      toast.success(`Switched to ${getRoleInfo(role).title} workspace`);
      router.refresh(); // Refresh current page to apply new role context immediately
    } catch (error) {
      const e = error as { status?: number; message?: string };
      if (e.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(e.message || "Failed to switch role.");
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center -ml-1.5">
              <AppIcon name="command" className="text-violet-600 dark:text-violet-400 w-4 h-4" />
            </div>
            Workspace & Roles
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-8">
            You have access to multiple workspaces. Switch your active role below.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 sm:pl-8">
          {user.roles.map((role: string) => {
            const info = getRoleInfo(role);
            const isActive = role === activeRole;
            
            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                disabled={isLoading !== null || isActive}
                className={`relative flex items-center p-4 text-left border rounded-xl transition-all group shadow-sm ${
                  isActive 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20 ring-1 ring-violet-500" 
                    : "border-neutral-200 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 bg-card dark:bg-neutral-900 hover:shadow-md"
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-transform ${isActive ? "bg-violet-200/50 dark:bg-violet-900/50" : "bg-neutral-100 dark:bg-neutral-800 group-hover:scale-110"}`}>
                  <AppIcon name={info.icon as IconName} className={`w-5 h-5 ${isActive ? "text-violet-600 dark:text-violet-400" : "text-neutral-500 dark:text-neutral-400"}`} />
                </div>
                
                <div className="flex-1 pr-6">
                  <h3 className={`font-semibold text-sm ${isActive ? "text-violet-800 dark:text-violet-200" : "text-neutral-900 dark:text-white"}`}>
                    {info.title}
                  </h3>
                  <p className={`text-xs ${isActive ? "text-violet-600/80 dark:text-violet-300/70" : "text-neutral-500 dark:text-neutral-400"}`}>
                    {info.desc}
                  </p>
                </div>
                
                {isLoading === role ? (
                  <div className="absolute right-4 flex space-x-1 shrink-0">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : isActive ? (
                  <div className="absolute right-4 flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Active</span>
                    <AppIcon name="check" size="sm" className="text-violet-600 dark:text-violet-400" />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
