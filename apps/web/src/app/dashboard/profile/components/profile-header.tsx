"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
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
import { resolveAvatarUrl } from "@/lib/utils";

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

  const uploadAvatarMutation = useAvatarUpload({
    onSuccessCallback: () => handleOpenChange(false)
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
      <Card className="flex flex-col sm:flex-row items-center sm:items-center gap-6 p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl overflow-hidden relative">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500 dark:bg-emerald-600 border-4 border-white dark:border-neutral-900 shadow-sm flex items-center justify-center font-bold text-3xl overflow-hidden text-white">
            {profile?.avatar_url ? (
              <Image
                src={resolveAvatarUrl(profile.avatar_url) as string}
                alt={profile.name || "User"}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <span className="uppercase">{profile?.name ? profile.name.substring(0, 2) : "KR"}</span>
            )}
          </div>
          <button
            onClick={() => setIsAvatarOpen(true)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-md flex items-center justify-center text-neutral-500 hover:text-emerald-600 transition-colors z-10"
          >
            <AppIcon name="edit" size="xs" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white truncate">
              {isLoading && !profile ? <Skeleton className="h-7 w-40 mx-auto sm:mx-0" /> : (profile?.name || "Karthik R")}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                <AppIcon name="hash" className="w-3 h-3 mr-1 opacity-70" />
                {isLoading && !profile ? "..." : (profile?.employee_id || "G4K001")}
              </Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2.5 py-0.5 text-[10px] font-bold rounded-md">
                {isLoading && !profile ? "..." : (profile?.designation?.name || "Senior Head")}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 flex-wrap">
            <span className="flex items-center gap-1.5 truncate max-w-full">
              <AppIcon name="mail" className="w-4 h-4 text-neutral-400" />
              <span className="truncate">{profile?.email || "g4kkarthik@gmail.com"}</span>
            </span>
            <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
            <span className="flex items-center gap-1.5 truncate max-w-full">
              <AppIcon name="phone" className="w-4 h-4 text-neutral-400" />
              <span>{profile?.phone || "7708219011"}</span>
            </span>
            <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
            <span className="flex items-center gap-1.5 truncate max-w-full">
              <AppIcon name="users" className="w-4 h-4 text-neutral-400" />
              <span>{profile?.department?.name || "YouTube Team"}</span>
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
                  <Image src={previewUrl} alt="Preview" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
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
