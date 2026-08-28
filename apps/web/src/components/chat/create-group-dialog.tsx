import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, FormDraftAlert } from "@g4k/ui/components";
import { Button, Input, Label, ScrollArea, Checkbox } from "@g4k/ui/components";
import { apiFetch, unwrapList, isQueued } from "@/lib/api-client";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/auth-store";
import { useFormDraft } from "@/hooks/use-form-draft";

interface DialogUser {
  id: number;
  name: string;
  department?: { name?: string };
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (convId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  
  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("group_create", { name: "", selectedUsers: [] as number[], tab: "dm" as "dm" | "group" });

  const currentUser = useAuthStore((s) => s.user);

  const { data: usersData, isLoading } = useQuery({
    queryKey: [queryKeys.usersList, search],
    queryFn: () => apiFetch(`/chat/users?search=${encodeURIComponent(search)}`),
    enabled: open,
  });

  const users = unwrapList(usersData);
  const otherUsers = users.filter((u: DialogUser) => u.id !== currentUser?.id);

  const mutation = useMutation({
    mutationFn: async () => {
      if (draftData.tab === "dm") {
        return apiFetch("/conversations/dm", {
          method: "POST",
          body: JSON.stringify({ recipient_id: draftData.selectedUsers[0] }),
        });
      } else {
        return apiFetch("/conversations/group", {
          method: "POST",
          body: JSON.stringify({ name: draftData.name, member_ids: draftData.selectedUsers }),
        });
      }
    },
    onSuccess: (data) => {
      if (isQueued(data)) return;
      if (isQueued(data)) {
        onOpenChange(false);
        setDraftData({ name: "", selectedUsers: [], tab: "dm" }); 
        clearDraft();
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      toast.success(draftData.tab === "dm" ? "Direct message started" : "Group created successfully");
      onOpenChange(false);
      setDraftData({ name: "", selectedUsers: [], tab: "dm" });
      clearDraft();
      if (onSuccess) onSuccess(data?.id || data?.conversation_id || (data?.data && (data.data.id || data.data.conversation_id)));
    },
    onError: (error: any) => {
      toast.error(error.message || (draftData.tab === "dm" ? "Failed to start direct message" : "Failed to create group"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftData.tab === "group" && !draftData.name.trim()) return toast.error("Name is required");
    if (draftData.selectedUsers.length === 0) return toast.error("Select at least one user");
    mutation.mutate();
  };

  const toggleUser = (userId: number) => {
    if (draftData.tab === "dm") {
      setDraftData({ ...draftData, selectedUsers: [userId] });
    } else {
      if (draftData.selectedUsers.includes(userId)) {
        setDraftData({ ...draftData, selectedUsers: draftData.selectedUsers.filter(id => id !== userId) });
      } else {
        setDraftData({ ...draftData, selectedUsers: [...draftData.selectedUsers, userId] });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        
        {hasDraft && (
          <FormDraftAlert onRestore={restoreDraft} onDiscard={clearDraft} />
        )}

        <div className="flex gap-2 mb-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
          <button 
            type="button" 
            onClick={() => setDraftData({ ...draftData, tab: "dm", selectedUsers: [] })}
            className={`flex-1 py-1 text-xs font-medium rounded ${draftData.tab === "dm" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
          >
            Direct Message
          </button>
          <button 
            type="button" 
            onClick={() => setDraftData({ ...draftData, tab: "group", selectedUsers: [] })}
            className={`flex-1 py-1 text-xs font-medium rounded ${draftData.tab === "group" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
          >
            Group
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {draftData.tab === "group" && (
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g. Project Alpha Team"
                value={draftData.name}
                onChange={(e) => setDraftData({ ...draftData, name: e.target.value })}
                disabled={mutation.isPending}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Select {draftData.tab === "dm" ? "User" : "Members"}</Label>
            <Input 
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
            <ScrollArea className="h-48 border rounded-[var(--radius)] p-2 border-neutral-200 dark:border-neutral-800">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-neutral-500">Loading users...</div>
              ) : (
                <div className="space-y-2">
                  {otherUsers.map((u: DialogUser) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded cursor-pointer transition-colors">
                      <Checkbox 
                        checked={draftData.selectedUsers.includes(u.id)}
                        onCheckedChange={() => toggleUser(u.id)}
                      />
                      <span>{u.name}</span>
                      <span className="text-xs text-neutral-400 ml-auto capitalize">{(u as any).active_role?.replace('_', ' ')}</span>
                    </label>
                  ))}
                  {otherUsers.length === 0 && (
                     <EmptyState 
                       title="No users found" 
                       className="min-h-[100px] border-none shadow-none mt-4" 
                     />
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || (draftData.tab === "group" && !draftData.name.trim()) || draftData.selectedUsers.length === 0}>
              {mutation.isPending ? "Starting..." : (draftData.tab === "dm" ? "Start Chat" : "Create Group")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
