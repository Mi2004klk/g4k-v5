"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

interface EraseUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName: string;
  onSuccess?: () => void;
}

export function EraseUserDialog({ open, onOpenChange, userId, userName, onSuccess }: EraseUserDialogProps) {
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");

  const anonymizeMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/users/${userId}/anonymize`, {
        method: "DELETE",
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("User erased and anonymized successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      if (onSuccess) onSuccess();
      onOpenChange(false);
      setConfirmText("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to erase user.");
    }
  });

  const isConfirmed = confirmText === "ERASE";

  const handleErase = () => {
    if (!isConfirmed) return;
    anonymizeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-rose-600 flex items-center gap-2">
            <AppIcon name="warning" className="h-5 w-5" />
            Erase Employee Record
          </DialogTitle>
          <DialogDescription>
            This will permanently anonymize <strong className="text-neutral-900 dark:text-white">{userName}</strong>'s personal information (name, email, phone, etc.). This action <strong>cannot be undone</strong> and is typically used for offboarding compliance (e.g., GDPR Right to be Forgotten).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-erase">Type <strong className="text-rose-600">ERASE</strong> to confirm:</Label>
            <Input 
              id="confirm-erase"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ERASE"
              disabled={anonymizeMutation.isPending}
              className="font-mono uppercase"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" type="button" onClick={() => {
            onOpenChange(false);
            setConfirmText("");
          }} disabled={anonymizeMutation.isPending}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleErase} 
            disabled={!isConfirmed || anonymizeMutation.isPending}
          >
            {anonymizeMutation.isPending ? "Erasing..." : "Permanently Erase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
