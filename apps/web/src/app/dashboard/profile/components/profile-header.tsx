"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";

import { Card, CardContent, Avatar, AvatarFallback, Button } from "@g4k/ui/components";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => apiFetch("/profile"),
  });

  const handleOpenChange = (open: boolean) => {
    setIsAvatarOpen(open);
    if (!open) {
      setAvatarFile(null);
      setPreviewUrl(null);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const token = getAuthToken();
      let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
      if (API_BASE_URL.startsWith("http") && !API_BASE_URL.endsWith("/api")) {
        API_BASE_URL = `${API_BASE_URL.replace(/\/$/, "")}/api`;
      }
      const baseUrl = API_BASE_URL.startsWith("http")
        ? API_BASE_URL.replace(/\/$/, "")
        : `${window.location.origin}${API_BASE_URL}`;

      const res = await fetch(`${baseUrl}/profile/avatar`, {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          "Accept": "application/json",
        },
        body: formData,
      });

      if (!res.ok) {
        let errMessage = "Failed to upload avatar.";
        try {
          const errorData = await res.json();
          errMessage = errorData.message || errMessage;
        } catch {}
        throw new Error(errMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Avatar updated!");
      handleOpenChange(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to upload avatar.");
    },
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/svg+xml"].includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, WEBP, GIF, SVG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be 2MB or less.");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, []);

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
      <Dialog open={isAvatarOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-display">Upload Profile Photo</DialogTitle>
            <DialogDescription className="text-xs font-sans">
              Choose a clear photo so your team can easily recognize you.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {!previewUrl ? (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging ? "border-brand-violet bg-brand-violet/5" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
              >
                <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-full mb-3">
                  <AppIcon name="upload" className="text-neutral-500 w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Click or drag and drop</p>
                <p className="text-xs text-neutral-500 mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center py-4 relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-950 shadow-lg relative group">
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <AppIcon name="edit" size="sm" className="mr-1" /> Change
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setAvatarFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <AppIcon name="trash" size="sm" className="mr-1" /> Remove Photo
                </Button>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} className="font-sans">
              Cancel
            </Button>
            <Button
              onClick={() => avatarFile && uploadAvatarMutation.mutate(avatarFile)}
              disabled={uploadAvatarMutation.isPending || !avatarFile}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-sans shadow-e1"
            >
              {uploadAvatarMutation.isPending ? (
                <>
                  <AppIcon name="loading" className="mr-2 animate-spin" /> Uploading...
                </>
              ) : (
                "Save Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
