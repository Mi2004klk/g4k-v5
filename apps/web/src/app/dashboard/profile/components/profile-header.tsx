"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";

import { Card, Avatar, AvatarFallback, Button, Badge } from "@g4k/ui/components";
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
      toast.error("Please select a valid image file.");
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

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, []);

  return (
    <>
      <Card className="flex flex-col sm:flex-row items-center sm:items-center gap-5 p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 hidden sm:block" />
        
        <div className="relative group shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 shadow-sm flex items-center justify-center font-bold text-2xl overflow-hidden text-neutral-400">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name || "User"}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <Avatar className="w-full h-full">
                <AvatarFallback name={profile?.name || ""} className="text-2xl" />
              </Avatar>
            )}
          </div>
          <button
            onClick={() => setIsAvatarOpen(true)}
            className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold flex-col gap-0.5 backdrop-blur-sm"
          >
            <AppIcon name="edit" size="xs" />
            <span>Update</span>
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white truncate">
              {isLoading && !profile ? <Skeleton className="h-7 w-40 mx-auto sm:mx-0" /> : (profile?.name || "Your Profile")}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-100 border-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                <AppIcon name="hash" size="xs" className="mr-1 opacity-70" />
                {isLoading && !profile ? "..." : (profile?.employee_id || "N/A")}
              </Badge>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 font-medium">
                {isLoading && !profile ? "..." : (profile?.designation?.name || "Employee")}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1.5 truncate max-w-full">
              <AppIcon name="mail" size="xs" className="text-neutral-400" />
              <span className="truncate">{profile?.email || "No email"}</span>
            </span>
            {profile?.phone && (
              <>
                <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
                <span className="flex items-center gap-1.5 shrink-0">
                  <AppIcon name="phone" size="xs" className="text-neutral-400" />
                  {profile.phone}
                </span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
            <span className="flex items-center gap-1.5 shrink-0">
              <AppIcon name="building" size="xs" className="text-neutral-400" />
              {profile?.department?.name || "No Department"}
            </span>
          </div>
        </div>
      </Card>

      <Dialog open={isAvatarOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription className="text-xs">
              Upload a clear photo to help your team recognize you.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {!previewUrl ? (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                }`}
              >
                <div className="bg-white dark:bg-neutral-800 p-3 rounded-full shadow-sm mb-3 border border-neutral-100 dark:border-neutral-700">
                  <AppIcon name="upload" className="text-primary-600 dark:text-primary-400 w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Click or drag and drop</p>
                <p className="text-xs text-neutral-500 mt-1">SVG, PNG, JPG (max. 2MB)</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center py-4 relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 shadow-md relative group">
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white hover:bg-white/20 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <AppIcon name="edit" size="xs" className="mr-1.5" /> Change
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 text-xs"
                  onClick={() => {
                    setAvatarFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <AppIcon name="trash" size="xs" className="mr-1.5" /> Remove
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => avatarFile && uploadAvatarMutation.mutate(avatarFile)}
              disabled={uploadAvatarMutation.isPending || !avatarFile}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
            >
              {uploadAvatarMutation.isPending ? (
                <><AppIcon name="loading" size="xs" className="mr-2 animate-spin" /> Saving...</>
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
