import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@g4k/ui/components";
import { Button, Input, Label, ScrollArea, Checkbox } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/auth-store";
import { useFormDraft } from "@/hooks/use-form-draft";
import { Alert, AlertDescription, AlertTitle } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";

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
  const [tab, setTab] = useState<"dm" | "group">("dm");
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  
  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("group_create", { name: "", selectedUsers: [] as number[], tab: "dm" as "dm" | "group" });

  const activeName = name || draftData.name;
  const activeSelectedUsers = selectedUsers.length > 0 ? selectedUsers : draftData.selectedUsers;
  const activeTab = tab !== "dm" ? tab : draftData.tab;

  const handleFieldChange = (updates: any) => {
    setDraftData({
      name: name || draftData.name,
      selectedUsers: selectedUsers.length > 0 ? selectedUsers : draftData.selectedUsers,
      tab: tab !== "dm" ? tab : draftData.tab,
      ...updates
    });
  };

  const currentUser = useAuthStore((s) => s.user);

  const { data: usersData, isLoading } = useQuery({
    queryKey: [queryKeys.usersList, search],
    queryFn: () => apiFetch(`/chat/users?search=${encodeURIComponent(search)}`),
    enabled: open,
  });

  const users = Array.isArray(usersData) ? usersData : (usersData?.data || []);
  const otherUsers = users.filter((u: DialogUser) => u.id !== currentUser?.id);

  const mutation = useMutation({
    mutationFn: async () => {
      if (activeTab === "dm") {
        return apiFetch("/conversations/dm", {
          method: "POST",
          body: JSON.stringify({ recipient_id: activeSelectedUsers[0] }),
        });
      } else {
        return apiFetch("/conversations/group", {
          method: "POST",
          body: JSON.stringify({ name: activeName, member_ids: activeSelectedUsers }),
        });
      }
    },
    onSuccess: (data) => {
      import("@/lib/api-client").then(({ isQueued }) => {
        if (isQueued(data)) {
          onOpenChange(false);
          setName(""); clearDraft(); setSelectedUsers([]);
          return;
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        toast.success(activeTab === "dm" ? "Direct message started" : "Group created successfully");
        onOpenChange(false);
        setName(""); clearDraft();
        setSelectedUsers([]);
        if (onSuccess) onSuccess(data.id);
      });
    },
    onError: () => {
      toast.error(activeTab === "dm" ? "Failed to start direct message" : "Failed to create group");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "group" && !activeName.trim()) return toast.error("Name is required");
    if (activeSelectedUsers.length === 0) return toast.error("Select at least one user");
    mutation.mutate();
  };

  const toggleUser = (userId: number) => {
    if (activeTab === "dm") {
      setSelectedUsers([userId]);
      handleFieldChange({ selectedUsers: [userId] });
    } else {
      if (activeSelectedUsers.includes(userId)) {
        const newUsers = activeSelectedUsers.filter(id => id !== userId);
        setSelectedUsers(newUsers);
        handleFieldChange({ selectedUsers: newUsers });
      } else {
        const newUsers = [...activeSelectedUsers, userId];
        setSelectedUsers(newUsers);
        handleFieldChange({ selectedUsers: newUsers });
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
          <Alert className="mb-2 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
            <AlertTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm">
              <AppIcon name="history" size="sm" />
              Draft Available
            </AlertTitle>
            <AlertDescription className="text-blue-700/80 dark:text-blue-400 text-xs flex items-center justify-between mt-1">
              <span>You have an unsaved draft.</span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={restoreDraft}>Restore</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40" onClick={clearDraft}>Discard</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 mb-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
          <button 
            type="button" 
            onClick={() => { setTab("dm"); setSelectedUsers([]); handleFieldChange({ tab: "dm", selectedUsers: [] }); }}
            className={`flex-1 py-1 text-xs font-medium rounded ${activeTab === "dm" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
          >
            Direct Message
          </button>
          <button 
            type="button" 
            onClick={() => { setTab("group"); setSelectedUsers([]); handleFieldChange({ tab: "group", selectedUsers: [] }); }}
            className={`flex-1 py-1 text-xs font-medium rounded ${activeTab === "group" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
          >
            Group
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {activeTab === "group" && (
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g. Project Alpha Team"
                value={activeName}
                onChange={(e) => { setName(e.target.value); handleFieldChange({ name: e.target.value }); }}
                disabled={mutation.isPending}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Select {activeTab === "dm" ? "User" : "Members"}</Label>
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
                        checked={activeSelectedUsers.includes(u.id)}
                        onCheckedChange={() => toggleUser(u.id)}
                      />
                      <span>{u.name}</span>
                      <span className="text-xs text-neutral-400 ml-auto capitalize">{(u as any).active_role?.replace('_', ' ')}</span>
                    </label>
                  ))}
                  {otherUsers.length === 0 && (
                     <div className="p-2 text-xs text-neutral-500 text-center">No users found</div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || (activeTab === "group" && !name.trim()) || selectedUsers.length === 0}>
              {mutation.isPending ? "Starting..." : (activeTab === "dm" ? "Start Chat" : "Create Group")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
