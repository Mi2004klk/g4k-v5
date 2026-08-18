"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { strongPasswordSchema } from "@/lib/validations";
import { parseUserAgent } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { queryKeys } from "@/lib/query-keys";

import {
  Button,
  PasswordInput,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable
} from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";

interface SessionRecord {
  id: string;
  device_name?: string;
  user_agent?: string;
  ip_address?: string;
  created_at?: string;
  last_used_at?: string;
  is_current?: boolean;
}

export function ProfileSecurityTab() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: sessions } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => apiFetch("/auth/sessions"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }
      const valResult = strongPasswordSchema.safeParse(newPassword);
      if (!valResult.success) {
        throw new Error(valResult.error.issues[0]?.message || "Invalid password.");
      }
      return apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to change password.");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Session revoked!");
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      setIsRevokeOpen(false);
      setRevokeId(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to revoke session.");
    },
  });

  const columns: ColumnDef<SessionRecord>[] = [
    {
      accessorKey: "device_name",
      header: "Device / Browser",
      cell: ({ row }) => (
        <div className="flex flex-col min-w-[120px]">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <AppIcon name="laptop" className=" text-brand-violet shrink-0" />
            <span className="truncate">{row.original.device_name || "Unknown Device"}</span>
          </div>
          {row.original.user_agent && (
            <span className="text-[10px] text-muted-foreground mt-0.5 ml-6">
              {parseUserAgent(row.original.user_agent)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.ip_address || "Unknown"}</span>
      ),
    },
    {
      accessorKey: "last_used_at",
      header: "Last Used",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.last_used_at ? new Date(row.original.last_used_at).toLocaleString() : "Recently"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        if (row.original.is_current) {
          return (
            <span className="px-2.5 py-1 rounded-[var(--radius)] text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20 whitespace-nowrap">
              Current Device
            </span>
          );
        }
        return <span className="text-muted-foreground text-[11px] font-medium">Active</span>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => {
        if (row.original.is_current) return null;
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRevokeId(row.original.id);
                setIsRevokeOpen(true);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium"
            >
              <AppIcon name="trash" className=" mr-1" />
              <span>Revoke</span>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Password Security Form */}
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-foreground">
                <AppIcon name="key" className=" text-brand-violet" />
                Security & Password
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-sans mt-1">
                Change your password and manage two-factor authentication.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs font-sans">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!changePasswordMutation.isPending && currentPassword && newPassword && confirmPassword) {
                changePasswordMutation.mutate();
              }
            }}
          >
            <DisabledWhileSubmitting isSubmitting={changePasswordMutation.isPending}>
              <div className="space-y-4">
                <input type="text" name="username" value={authUser?.email || ""} autoComplete="username" className="hidden" readOnly />
                <div>
                  <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Current Password</label>
                  <PasswordInput
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="font-sans"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">New Password</label>
                  <PasswordInput
                    placeholder="New password (min 8 chars, mixed case, numbers, symbols)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="font-sans"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Confirm New Password</label>
                  <PasswordInput
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="font-sans"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    changePasswordMutation.isPending ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 font-sans"
                >
                  {changePasswordMutation.isPending ? (
                    <AppIcon name="loading" className=" animate-spin animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </DisabledWhileSubmitting>
          </form>
        </CardContent>
      </Card>

      {/* Active Device Sessions */}
      <Card className="border border-border shadow-e1 bg-card rounded-xl lg:col-span-2">
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-foreground">
              <AppIcon name="laptop" className=" text-brand-violet" />
              Active Device Sessions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-sans mt-1">
              Devices currently logged into your Games4King Workplace OS account. Revoking a session will immediately log out that device.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await apiFetch("/auth/logout", { method: "POST" });
                toast.success("Logged out successfully");
                window.location.href = "/login";
              } catch (e) {
                const err = e as { message?: string };
                toast.error(err.message || "Logout failed");
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 shrink-0"
          >
            Log Out Current Device
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto border-t border-border dark:border-neutral-800">
          <DataTable
            columns={columns}
            data={sessions || []}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isRevokeOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRevokeOpen(false);
            setRevokeId(null);
          }
        }}
        onConfirm={() => {
          if (revokeId) {
            revokeSessionMutation.mutate(revokeId);
          }
        }}
        title="Revoke Session"
        description="Are you sure you want to log out this device? Any unsaved work on that device may be lost."
        confirmText="Revoke Device"
        isLoading={revokeSessionMutation.isPending}
      />
    </div>
  );
}
