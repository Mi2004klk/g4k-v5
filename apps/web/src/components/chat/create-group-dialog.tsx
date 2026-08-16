import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@g4k/ui/components";
import { Button, Input, Label, ScrollArea, Checkbox, AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/auth-store";

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
  const currentUser = useAuthStore((s) => s.user);

  const { data: usersData, isLoading } = useQuery({
    queryKey: queryKeys.usersList,
    queryFn: () => apiFetch("/users?per_page=1000"),
    enabled: open,
  });

  const users = Array.isArray(usersData?.data) ? usersData.data : (usersData?.data?.data || []);
  const otherUsers = users.filter((u: any) => 
    u.id !== currentUser?.id && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.department?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (tab === "dm") {
        return apiFetch("/conversations/dm", {
          method: "POST",
          body: JSON.stringify({ recipient_id: selectedUsers[0] }),
        });
      } else {
        return apiFetch("/conversations/group", {
          method: "POST",
          body: JSON.stringify({ name, member_ids: selectedUsers }),
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      toast.success(tab === "dm" ? "Direct message started" : "Group created successfully");
      onOpenChange(false);
      setName("");
      setSelectedUsers([]);
      if (onSuccess) onSuccess(data.id);
    },
    onError: () => {
      toast.error(tab === "dm" ? "Failed to start direct message" : "Failed to create group");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "group" && !name.trim()) return toast.error("Name is required");
    if (selectedUsers.length === 0) return toast.error("Select at least one user");
    mutation.mutate();
  };

  const toggleUser = (userId: number) => {
    if (tab === "dm") {
      setSelectedUsers([userId]);
    } else {
      if (selectedUsers.includes(userId)) {
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
      } else {
        setSelectedUsers([...selectedUsers, userId]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
          <button 
            type="button" 
            onClick={() => { setTab("dm"); setSelectedUsers([]); }}
            className={`flex-1 py-1 text-xs font-medium rounded ${tab === "dm" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
          >
            Direct Message
          </button>
          <button 
            type="button" 
            onClick={() => { setTab("group"); setSelectedUsers([]); }}
            className={`flex-1 py-1 text-xs font-medium rounded ${tab === "group" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
          >
            Group
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {tab === "group" && (
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g. Project Alpha Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Select {tab === "dm" ? "User" : "Members"}</Label>
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
                  {otherUsers.map((u: any) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded cursor-pointer transition-colors">
                      <Checkbox 
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={() => toggleUser(u.id)}
                      />
                      <span>{u.name}</span>
                      <span className="text-xs text-neutral-400 ml-auto capitalize">{u.active_role?.replace('_', ' ')}</span>
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
            <Button type="submit" disabled={mutation.isPending || (tab === "group" && !name.trim()) || selectedUsers.length === 0}>
              {mutation.isPending ? "Starting..." : (tab === "dm" ? "Start Chat" : "Create Group")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
