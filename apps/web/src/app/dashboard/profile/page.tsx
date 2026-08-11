"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  KeyRound,
  Laptop,
  Trash2,
  Upload,
  Loader2,
  Eye,
  Building2,
  ExternalLink,
  Calendar,
  FileText,
  CheckSquare
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { strongPasswordSchema } from "@/lib/validations";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { PasswordInput } from "@g4k/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { CheckCircle2, Shield, EyeOff, LayoutDashboard, Settings } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { DataTable } from "@g4k/ui/components";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Form fields for profile update
  const [name, setName] = useState(authUser?.name || "");
  const [phone, setPhone] = useState("");

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Revoke Session state
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  // Visibility state
  const [visibility, setVisibility] = useState(authUser?.preferences?.directory_visibility || "internal");

  // Sync state when authUser loads
  useEffect(() => {
    if (authUser?.preferences?.directory_visibility) {
      setVisibility(authUser.preferences.directory_visibility);
    }
  }, [authUser?.preferences?.directory_visibility]);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const data = await apiFetch("/profile");
      setName(data.name || "");
      setPhone(data.phone || "");
      return data;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => apiFetch("/auth/sessions"),
  });

  const { data: companyProfile, isLoading: isCompanyLoading } = useQuery({
    queryKey: queryKeys.companyProfile,
    queryFn: () => apiFetch("/company-profile"),
  });

  const { data: attendanceHistory } = useQuery({
    queryKey: ["attendance-history-me"],
    queryFn: () => apiFetch("/attendance/me/history?limit=31"),
  });

  const { data: leaveHistory } = useQuery({
    queryKey: ["leave-history-me"],
    queryFn: () => apiFetch("/leave-requests/history?limit=100"),
  });

  const { data: activeTasks } = useQuery({
    queryKey: ["tasks-me"],
    queryFn: () => apiFetch("/tasks"),
  });

  // Calculate summaries
  const attendanceData = attendanceHistory?.data || [];
  const presentCount = attendanceData.filter((r: any) => ["present", "late", "half_day"].includes(r.status)).length;
  const absentCount = attendanceData.filter((r: any) => r.status === "absent").length;
  const lateCount = attendanceData.filter((r: any) => r.status === "late").length;

  const leaveData = leaveHistory?.data || [];
  const approvedLeaves = leaveData.filter((l: any) => l.approval?.status === "approved").length;
  const pendingLeaves = leaveData.filter((l: any) => !l.approval || l.approval.status === "pending").length;

  const taskData = activeTasks?.data || [];
  const pendingTasks = taskData.filter((t: any) => t.status === "pending" || t.status === "in_progress").length;
  const completedTasks = taskData.filter((t: any) => t.status === "completed").length;

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
        setAuth(useAuthStore.getState().token!, res, authUser.active_role);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async (val: string) => {
      return apiFetch("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({ directory_visibility: val }),
      });
    },
    onSuccess: (res: any) => {
      toast.success("Visibility preference updated!");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, { ...authUser, preferences: res.preferences }, authUser.active_role);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update preference.");
    },
  });

  const handleVisibilityChange = (val: string) => {
    setVisibility(val);
    updateVisibilityMutation.mutate(val);
  };

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      return apiFetch("/profile/avatar", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast.success("Avatar updated!");
      setIsAvatarOpen(false);
      setAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      setIsRevokeOpen(false);
      setRevokeId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke session.");
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "device_name",
      header: "Device / Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white min-w-[120px]">
          <Laptop className="w-4 h-4 text-brand-violet shrink-0" />
          <span className="truncate">{row.original.device_name || "Web Browser"}</span>
        </div>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400 font-mono text-xs">{row.original.ip_address || "Unknown"}</span>
      ),
    },
    {
      accessorKey: "last_used_at",
      header: "Last Used",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs">
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
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20 whitespace-nowrap">
              Current Device
            </span>
          );
        }
        return <span className="text-neutral-400 text-[11px] font-medium">Active</span>;
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
              <Trash2 className="w-4 h-4 mr-1" />
              <span>Revoke</span>
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header Profile Card */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden bg-white dark:bg-neutral-900 rounded-xl relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-brand" />
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-brand-violet/5 dark:bg-brand-violet/10">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-neutral-800 border-2 border-brand-violet flex items-center justify-center font-bold text-3xl shadow-sm overflow-hidden text-brand-violet">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.name?.charAt(0) || "U"
              )}
            </div>
            <button
              onClick={() => setIsAvatarOpen(true)}
              className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1 backdrop-blur-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">{profile?.name}</h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-semibold">
                  {profile?.designation?.name || "Corporate Team Member"} •{" "}
                  {profile?.department?.name || "Games4King"}
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 shadow-sm">
                ID: {profile?.employee_code || profile?.employee_id || "N/A"}
              </span>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-3 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              <span className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <Mail className="w-3.5 h-3.5 text-brand-violet" />
                {profile?.email}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <Phone className="w-3.5 h-3.5 text-brand-violet" />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini-Cards for EMP-5 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">My Attendance (Recent)</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{presentCount} Present</span> •{" "}
                <span className="font-medium text-amber-600 dark:text-amber-400">{lateCount} Late</span> •{" "}
                <span className="font-medium text-rose-600 dark:text-rose-400">{absentCount} Absent</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">My Leave Summary</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{approvedLeaves} Approved</span> •{" "}
                <span className="font-medium text-amber-600 dark:text-amber-400">{pendingLeaves} Pending</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg shrink-0">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">My Active Tasks</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="font-medium text-violet-600 dark:text-violet-400">{pendingTasks} Active</span> •{" "}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{completedTasks} Completed</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-neutral-900 dark:text-white">
              <User className="w-4 h-4 text-brand-violet" />
              Personal & Contact Information
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Update your display name and phone number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-sans">
            <div>
              <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="font-sans" />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Phone Number</label>
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="font-sans"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-neutral-400">Email Address (Read-only)</label>
              <Input value={profile?.email || ""} disabled className="bg-neutral-50 dark:bg-neutral-800/50 font-sans" />
            </div>
            <Button
              onClick={() => updateProfileMutation.mutate({ name, phone })}
              disabled={updateProfileMutation.isPending}
              className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm font-sans"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Personal Info"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
           {/* Privacy & Visibility Preferences */}
           <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
             <CardHeader>
               <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-neutral-900 dark:text-white">
                 <Eye className="w-4 h-4 text-brand-violet" />
                 Privacy & Visibility
               </CardTitle>
               <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                 Control who can see your contact information in the company directory.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 gap-2">
                   <button
                     onClick={() => handleVisibilityChange("public")}
                     disabled={updateVisibilityMutation.isPending}
                     className={`p-3 text-left border rounded-lg transition-colors ${visibility === "public" ? "border-brand-violet bg-brand-violet/5" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
                   >
                      <div className="font-semibold text-neutral-900 dark:text-white mb-0.5">Public</div>
                      <div className="text-neutral-500 text-[11px]">Phone and email visible to all users.</div>
                   </button>
                   <button
                     onClick={() => handleVisibilityChange("internal")}
                     disabled={updateVisibilityMutation.isPending}
                     className={`p-3 text-left border rounded-lg transition-colors ${visibility === "internal" ? "border-brand-violet bg-brand-violet/5" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
                   >
                      <div className="font-semibold text-neutral-900 dark:text-white mb-0.5">Internal Only</div>
                      <div className="text-neutral-500 text-[11px]">Contact info visible only to your department & HR.</div>
                   </button>
                   <button
                     onClick={() => handleVisibilityChange("private")}
                     disabled={updateVisibilityMutation.isPending}
                     className={`p-3 text-left border rounded-lg transition-colors ${visibility === "private" ? "border-brand-violet bg-brand-violet/5" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
                   >
                      <div className="font-semibold text-neutral-900 dark:text-white mb-0.5">Private</div>
                      <div className="text-neutral-500 text-[11px]">Contact info completely hidden from directory.</div>
                   </button>
                </div>
             </CardContent>
           </Card>

           {/* Password Security Form */}
           <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
             <CardHeader>
               <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-neutral-900 dark:text-white">
                 <KeyRound className="w-4 h-4 text-brand-violet" />
                 Security & Password
               </CardTitle>
               <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                 Change your password to maintain account security.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4 text-xs font-sans">
               <div>
                 <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Current Password</label>
                 <PasswordInput
                   placeholder="Current password"
                   value={currentPassword}
                   onChange={(e) => setCurrentPassword(e.target.value)}
                   className="font-sans"
                 />
               </div>
               <div>
                 <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">New Password</label>
                 <PasswordInput
                   placeholder="New password (min 8 chars, mixed case, numbers, symbols)"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   className="font-sans"
                 />
               </div>
               <div>
                 <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Confirm New Password</label>
                 <PasswordInput
                   placeholder="Confirm new password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   className="font-sans"
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
                 className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm font-sans"
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
      </div>

      {/* Company Profile (Read-Only) */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-neutral-200 dark:bg-neutral-800" />
        <CardHeader className="flex flex-row justify-between items-start pt-6">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-neutral-900 dark:text-white">
              <Building2 className="w-4 h-4 text-brand-violet" />
              Company Information
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1">
              General details about the organization.
            </CardDescription>
          </div>
          {authUser?.active_role === 'super_admin' && (
            <Link href="/dashboard/settings" className="text-xs font-semibold text-brand-violet flex items-center gap-1 hover:underline">
              Edit in Settings <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4 font-sans text-sm">
          {isCompanyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-neutral-500 mb-1">Company Name</div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {companyProfile?.name || "Games4King"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-neutral-500 mb-1">Short Name</div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {companyProfile?.short_name || "-"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-neutral-500 mb-1">Description</div>
                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                  {companyProfile?.description || "-"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-neutral-500 mb-1">Address</div>
                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                  {companyProfile?.address || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-neutral-500 mb-1">Primary Phone</div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  {companyProfile?.primary_phone || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-neutral-500 mb-1">Email</div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  {companyProfile?.email || "-"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Device Sessions */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-neutral-900 dark:text-white">
            <Laptop className="w-4 h-4 text-brand-violet" />
            Active Device Sessions
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
            Devices currently logged into your Games4King Workplace OS account. Revoking a session will immediately log out that device.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto border-t border-neutral-100 dark:border-neutral-800">
          <DataTable 
             columns={columns} 
             data={sessions || []}
          />
        </CardContent>
      </Card>

      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-display">Upload Profile Photo</DialogTitle>
            <DialogDescription className="sr-only">Confirm this action.</DialogDescription>
            <DialogDescription className="text-xs font-sans">
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
              className="font-sans file:bg-neutral-100 file:text-neutral-700 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md hover:file:bg-neutral-200 cursor-pointer text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvatarOpen(false)} className="font-sans">
              Cancel
            </Button>
            <Button
              onClick={() => avatarFile && uploadAvatarMutation.mutate(avatarFile)}
              disabled={uploadAvatarMutation.isPending || !avatarFile}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-sans shadow-sm"
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

      {/* Revoke Session Confirm Dialog */}
      <Dialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
        <DialogContent className="sm:max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="font-display text-red-600">Revoke Session</DialogTitle>
            <DialogDescription className="sr-only">Confirm this action.</DialogDescription>
            <DialogDescription className="text-xs font-sans">
              Are you sure you want to log out this device? Any unsaved work on that device may be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsRevokeOpen(false); setRevokeId(null); }} className="font-sans">
              Cancel
            </Button>
            <Button
              onClick={() => revokeId && revokeSessionMutation.mutate(revokeId)}
              disabled={revokeSessionMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-sans shadow-sm"
            >
              {revokeSessionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Revoke Device"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
