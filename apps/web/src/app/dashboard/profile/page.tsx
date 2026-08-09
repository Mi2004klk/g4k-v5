"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Shield,
  KeyRound,
  Laptop,
  Trash2,
  Upload,
  Loader2,
  Calendar,
  Heart,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user: authUser, setAuth } = useAuthStore();
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Form fields for profile update
  const [name, setName] = useState(authUser?.name || "");
  const [phone, setPhone] = useState("");

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const data = await apiFetch("/profile");
      setName(data.name || "");
      setPhone(data.phone || "");
      return data;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => apiFetch("/auth/sessions"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res: any) => {
      toast.success("Profile updated successfully!");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, res);
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await apiFetch("/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Avatar upload failed");
      }
      return res.json();
    },
    onSuccess: (res: any) => {
      toast.success("Avatar updated!");
      setIsAvatarOpen(false);
      setAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload avatar.");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
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
    onError: (err: any) => {
      toast.error(err.message || "Failed to change password.");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Session revoked!");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header Profile Card */}
      <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-r from-violet-900 to-purple-800 text-white">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center font-bold text-3xl shadow-xl overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.name?.charAt(0) || "U"
              )}
            </div>
            <button
              onClick={() => setIsAvatarOpen(true)}
              className="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold font-display">{profile?.name}</h1>
                <p className="text-xs text-purple-200">
                  {profile?.designation?.name || "Corporate Team Member"} •{" "}
                  {profile?.department?.name || "Games4King"}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 border border-white/20">
                {profile?.employee_code || profile?.employee_id || "G4K001"}
              </span>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2 text-xs text-purple-100">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-300" />
                {profile?.email}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-300" />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Details & Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-violet-600" />
              Personal & Contact Information
            </CardTitle>
            <CardDescription className="text-xs">
              Update your display name and phone number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold block mb-1">Phone Number</label>
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-400 block mb-1">Email Address</label>
              <Input value={profile?.email || ""} disabled className="bg-neutral-50 dark:bg-neutral-800" />
            </div>
            <Button
              onClick={() => updateProfileMutation.mutate({ name, phone })}
              disabled={updateProfileMutation.isPending}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Personal Info"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password Security Form */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-violet-600" />
              Security & Password
            </CardTitle>
            <CardDescription className="text-xs">
              Change your password to maintain account security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Current Password</label>
              <PasswordInput
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">New Password</label>
              <PasswordInput
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Confirm New Password</label>
              <PasswordInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={() => changePasswordMutation.mutate()}
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Device Sessions */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Laptop className="w-4 h-4 text-violet-600" />
            Active Device Sessions
          </CardTitle>
          <CardDescription className="text-xs">
            Devices currently logged into your Games4King Workplace OS account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {sessions && Array.isArray(sessions) && sessions.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Device / Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {sessions.map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 font-semibold flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-neutral-400" />
                      <span>{s.device_name || "Web Browser"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {s.is_current ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Current Device
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!s.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeSessionMutation.mutate(s.id)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Revoke</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-xs text-neutral-400">
              No remote device sessions active.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
            <DialogDescription className="text-xs">
              Select an image file (JPEG, PNG, WEBP, max 2MB).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("File size must be 2MB or less.");
                    return;
                  }
                  setAvatarFile(file);
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvatarOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => avatarFile && uploadAvatarMutation.mutate(avatarFile)}
              disabled={uploadAvatarMutation.isPending || !avatarFile}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {uploadAvatarMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Upload Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
