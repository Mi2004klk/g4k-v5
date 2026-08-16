"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { Card, CardContent, Avatar, AvatarFallback, Button, Input } from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";

export function ProfileHeader() {
  const queryClient = useQueryClient();
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => apiFetch("/profile"),
  });

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

  return (
    <>
      {/* Header Profile Card */}
      <Card className="border border-border shadow-e1 overflow-hidden bg-card rounded-xl relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary-600" />
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-brand-violet/5 dark:bg-brand-violet/10">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-card border-2 border-brand-violet flex items-center justify-center font-bold text-3xl shadow-e1 overflow-hidden text-brand-violet">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || "User"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Avatar className="w-full h-full">
                  <AvatarFallback name={profile?.name || ""} className="text-4xl" />
                </Avatar>
              )}
            </div>
            <button
              onClick={() => setIsAvatarOpen(true)}
              className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1 backdrop-blur-sm"
            >
              <AppIcon name="upload" />
              <span>Upload</span>
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">
                  {isLoading && !profile ? <Skeleton className="h-8 w-48 mb-2" /> : (profile?.name || "Your Profile")}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm font-sans mt-2">
                  <div className="flex items-center text-muted-foreground bg-surface/50 dark:bg-neutral-900/50 px-3 py-1 rounded-full border border-border">
                    <AppIcon name="hash" className=" mr-2 text-brand-violet/70" />
                    {isLoading && !profile ? <Skeleton className="h-4 w-24" /> : (profile?.employee_id || "Employee ID: N/A")}
                  </div>
                  <div className="flex items-center text-muted-foreground bg-surface/50 dark:bg-neutral-900/50 px-3 py-1 rounded-full border border-border">
                    <AppIcon name="building" className=" mr-2 text-brand-violet/70" />
                    {isLoading && !profile ? <Skeleton className="h-4 w-32" /> : (profile?.department?.name || "No Department")}
                  </div>
                  <div className="flex items-center text-muted-foreground bg-surface/50 dark:bg-neutral-900/50 px-3 py-1 rounded-full border border-border">
                    <AppIcon name="briefcase" className=" mr-2 text-brand-violet/70" />
                    {isLoading && !profile ? <Skeleton className="h-4 w-32" /> : (profile?.designation?.name || "No Designation")}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-3 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5 bg-card px-2 py-1 rounded-[var(--radius)] border border-border shadow-e1">
                <AppIcon name="mail" className=" .5 .5 text-brand-violet" />
                {profile?.email}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1.5 bg-card px-2 py-1 rounded-[var(--radius)] border border-border shadow-e1">
                  <AppIcon name="phone" className=" .5 .5 text-brand-violet" />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>
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
              className="font-sans file:bg-neutral-100 file:text-neutral-700 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius)] hover:file:bg-neutral-200 cursor-pointer text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvatarOpen(false)} className="font-sans">
              Cancel
            </Button>
            <Button
              onClick={() => avatarFile && uploadAvatarMutation.mutate(avatarFile)}
              disabled={uploadAvatarMutation.isPending || !avatarFile}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-sans shadow-e1"
            >
              {uploadAvatarMutation.isPending ? (
                <AppIcon name="loading" className=" animate-spin animate-spin" />
              ) : (
                "Upload Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
