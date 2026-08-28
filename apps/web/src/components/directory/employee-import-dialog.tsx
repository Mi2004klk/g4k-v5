"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

interface EmployeeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployeeImportDialog({ open, onOpenChange, onSuccess }: EmployeeImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return apiFetch("/users/import", {
        method: "POST",
        body: formData,
        // Let the browser set Content-Type for FormData
      }, {
        raw: true // Prevents apiFetch from overriding Content-Type to JSON
      }).then((res: Response) => {
          if (!res.ok) throw res;
          return res.json();
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Import successful");
      if (data.errors && data.errors.length > 0) {
        toast.error(`Some rows failed to import: ${data.errors[0]}`);
      }
      onSuccess();
    },
    onError: async (error: any) => {
      let msg = "Failed to import employees";
      if (error instanceof Response) {
        try {
          const body = await error.json();
          msg = body.message || msg;
        } catch (e) {
          // ignore
        }
      } else if (error.message) {
        msg = error.message;
      }
      toast.error(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }
    importMutation.mutate(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AppIcon name="upload" className="h-5 w-5 text-indigo-600" />
            Import Employees
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file containing employee details. The file must contain headers for at least <strong>name</strong> and <strong>email</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input 
              type="file" 
              accept=".csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={importMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending ? "Importing..." : "Upload & Import"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
