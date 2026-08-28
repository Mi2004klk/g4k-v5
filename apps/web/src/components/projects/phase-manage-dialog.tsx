"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Textarea, DatePicker, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";

export interface PhaseManageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: any;
}

export function PhaseManageDialog({ isOpen, onOpenChange, projectId, initialData }: PhaseManageDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "pending",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          description: initialData.description || "",
          status: initialData.status || "pending",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
        });
      } else {
        setFormData({
          name: "",
          description: "",
          status: "pending",
          start_date: "",
          end_date: "",
        });
      }
    }
  }, [isOpen, initialData]);

  const mutation = useMutation({
    mutationFn: async () => {
      const url = isEditing 
        ? `/projects/${projectId}/phases/${initialData.id}` 
        : `/projects/${projectId}/phases`;
        
      return apiFetch(url, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(formData),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success(`Phase ${isEditing ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: [...queryKeys.project(projectId), "phases"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || `Failed to ${isEditing ? 'update' : 'create'} phase`);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Phase' : 'Add New Phase'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this project phase.' : 'Create a new phase to organize project tasks.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Phase Name *</label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
              placeholder="e.g. Concept Creation" 
              autoFocus
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Description</label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} 
              placeholder="Optional phase details..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Start Date</label>
              <DatePicker 
                value={formData.start_date ? new Date(formData.start_date) : undefined} 
                onChange={(date) => setFormData(p => ({ ...p, start_date: date ? format(date, "yyyy-MM-dd") : "" }))}
                placeholder="Select date"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">End Date</label>
              <DatePicker 
                value={formData.end_date ? new Date(formData.end_date) : undefined} 
                onChange={(date) => setFormData(p => ({ ...p, end_date: date ? format(date, "yyyy-MM-dd") : "" }))}
                placeholder="Select date"
              />
            </div>
          </div>
          
          {isEditing && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !formData.name.trim()}>
            {mutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Phase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
