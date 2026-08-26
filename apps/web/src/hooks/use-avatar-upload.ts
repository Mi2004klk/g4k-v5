import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";

interface UseAvatarUploadOptions {
  onSuccessCallback?: () => void;
  userId?: number;
}

export function useAvatarUpload(options?: UseAvatarUploadOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Validate file
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/svg+xml"].includes(file.type)) {
        throw new Error("Please select a valid image file.");
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be 2MB or less.");
      }

      const formData = new FormData();
      formData.append("avatar", file);

      // Default to the generic profile avatar endpoint unless a specific user ID is provided.
      // Both essentially perform the same action for the current user.
      const endpoint = options?.userId ? `/users/${options.userId}/avatar` : "/profile/avatar";

      return apiFetch(endpoint, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data) => {
      toast.success("Profile photo updated successfully");
      
      // Update local auth store so layout avatar refreshes instantly
      if (data?.avatar_url) {
        useAuthStore.getState().updateUser({ avatar_url: data.avatar_url });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      if (options?.userId) {
        queryClient.invalidateQueries({ queryKey: ["user", options.userId] });
        queryClient.invalidateQueries({ queryKey: ["user", String(options.userId)] });
      }

      if (options?.onSuccessCallback) {
        options.onSuccessCallback();
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload photo");
    },
  });
}
