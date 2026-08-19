"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@g4k/ui/components";
import { Button, AppIcon, FileUploadPopup } from "@g4k/ui/components";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

interface ComposerData {
  title: string;
  body: string;
  scope: string;
  pinned: boolean;
  attachment?: File | null;
}

interface AnnouncementComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: number | null;
  initialData?: ComposerData;
  onSuccess?: () => void;
}

export function AnnouncementComposer({
  open,
  onOpenChange,
  editingId,
  initialData,
  onSuccess
}: AnnouncementComposerProps) {
  const queryClient = useQueryClient();
  const [createData, setCreateData] = useState<ComposerData>({ title: "", body: "", scope: "company", pinned: false });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const { formData: draftData, setFormData: setDraftData, clearDraft } = useFormDraft("announcement_create", { title: "", body: "", scope: "company", pinned: false });

  useEffect(() => {
    if (open) {
      if (editingId && initialData) {
        setCreateData(initialData);
        setAttachment(null);
      } else {
        setCreateData({
          title: draftData.title || "",
          body: draftData.body || "",
          scope: draftData.scope || "company",
          pinned: draftData.pinned || false
        });
        setAttachment(null);
      }
    }
  }, [open, editingId, initialData, draftData]);

  const handleFieldChange = (updates: Partial<ComposerData>) => {
    const newData = { ...createData, ...updates };
    setCreateData(newData);
    if (!editingId) {
      setDraftData({
        title: newData.title,
        body: newData.body,
        scope: newData.scope,
        pinned: newData.pinned
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: ComposerData & { id?: number }) => {
      const url = data.id ? `/announcements/${data.id}` : "/announcements";
      const method = data.id ? "PUT" : "POST";
      
      if (attachment) {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("body", data.body);
        formData.append("scope", data.scope);
        formData.append("pinned", data.pinned ? "1" : "0");
        formData.append("attachment", attachment);
        if (data.id) {
            formData.append("_method", "PUT");
            return apiFetch(url, { method: "POST", body: formData });
        }
        return apiFetch(url, { method: "POST", body: formData });
      }
      
      return apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      if (!editingId) clearDraft();
      onOpenChange(false);
      onSuccess?.();
      toast.success(editingId ? "Announcement updated" : "Announcement posted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to post announcement");
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto thin-scrollbar">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Announcement" : "Post Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Title</label>
              <input
                id="title"
                value={createData.title}
                onChange={(e) => handleFieldChange({ title: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-shadow"
                placeholder="Announcement title"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="body" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Message (Markdown Supported)</label>
              </div>
              <textarea
                id="body"
                value={createData.body}
                onChange={(e) => handleFieldChange({ body: e.target.value })}
                className="flex min-h-[120px] w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-shadow resize-y"
                placeholder="Use **bold**, *italics*, [links](http://...) to format..."
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Audience & Options</label>
              <div className="flex flex-col gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-2">
                  <select
                    value={createData.scope}
                    onChange={(e) => handleFieldChange({ scope: e.target.value })}
                    className="h-8 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="company">Company-wide</option>
                    <option value="team">Team Only</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createData.pinned}
                    onChange={(e) => handleFieldChange({ pinned: e.target.checked })}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <AppIcon name="pin" size="xs" className="text-amber-500" /> Pin to top
                  </span>
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Attachments</label>
              {attachment ? (
                <div className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <div className="flex items-center gap-2 min-w-0">
                    <AppIcon name="paperclip" size="xs" className="text-neutral-400 shrink-0" />
                    <span className="text-xs font-medium truncate">{attachment.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setAttachment(null)} className="h-6 w-6 text-neutral-400 hover:text-rose-500">
                    <AppIcon name="close" size="xs" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowUploadPopup(true)} className="w-full border-dashed h-10">
                  <AppIcon name="upload" size="sm" className="mr-2" /> Add Attachment
                </Button>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate({ ...createData, id: editingId || undefined })} 
              disabled={createMutation.isPending || !createData.title.trim() || !createData.body.trim()}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {createMutation.isPending && <AppIcon name="loading" className="mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Post Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileUploadPopup 
        open={showUploadPopup} 
        onOpenChange={setShowUploadPopup} 
        title="Upload Attachment" 
        description="Select a file to attach to this announcement. Maximum size is 10MB."
        maxSizeMB={10}
        acceptedTypes={[]} 
        onUpload={async (file) => {
          setAttachment(file);
          setShowUploadPopup(false);
        }} 
      />
    </>
  );
}
