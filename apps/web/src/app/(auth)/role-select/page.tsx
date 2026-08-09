"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldAlert, UserCheck, Users } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RoleSelectPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableRoles = user?.roles || ["employee"];

  async function handleRoleSelect(role: string) {
    setSelectedRole(role);
    setIsLoading(true);
    try {
      const result = await apiFetch("/auth/role-select", {
        method: "POST",
        body: JSON.stringify({ role }),
      });

      setAuth(result.token, result.user, result.active_role);
      toast.success(`Switched active role to ${role.replace("_", " ").toUpperCase()}`);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to switch role.");
    } finally {
      setIsLoading(false);
    }
  }

  const roleMeta: Record<string, { label: string; desc: string; icon: any }> = {
    super_admin: {
      label: "Super Admin",
      desc: "Full organization access, system configurations & administrative controls.",
      icon: ShieldAlert,
    },
    hr: {
      label: "HR Manager",
      desc: "Team management, leave approvals, attendance monitoring & employee logs.",
      icon: Users,
    },
    employee: {
      label: "Employee",
      desc: "Personal attendance, tasks, schedule, leave requests & profile management.",
      icon: UserCheck,
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900">
      <Card className="w-full max-w-lg shadow-2xl border-none">
        <CardHeader className="text-center space-y-2 pt-8">
          <CardTitle className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Select Active Role
          </CardTitle>
          <CardDescription className="text-sm">
            Your account holds multiple permission roles. Choose how you wish to operate in this session.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {availableRoles.map((roleKey) => {
              const meta = roleMeta[roleKey] || {
                label: roleKey,
                desc: "Standard access role",
                icon: UserCheck,
              };
              const Icon = meta.icon;
              const isPending = isLoading && selectedRole === roleKey;

              return (
                <button
                  key={roleKey}
                  onClick={() => handleRoleSelect(roleKey)}
                  disabled={isLoading}
                  className="flex items-start gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 text-left transition-all group active:scale-[0.98]"
                >
                  <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">
                        {meta.label}
                      </h4>
                      {isPending && <Loader2 className="w-4 h-4 animate-spin text-violet-600" />}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      {meta.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-neutral-500 hover:text-neutral-700"
              onClick={() => router.push("/login")}
            >
              Sign out & return to login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
