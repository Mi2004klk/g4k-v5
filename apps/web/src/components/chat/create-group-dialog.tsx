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
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: usersData, isLoading } = useQuery({
    queryKey: queryKeys.usersList,
    queryFn: () => apiFetch("/users?per_page=1000"),
    enabled: open,
  });

  const users = Array.isArray(usersData?.data) ? usersData.data : (usersData?.data?.data || []);
  const otherUsers = users.filter((u: any) => u.id !== currentUser?.id);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/conversations/group", {
        method: "POST",
        body: JSON.stringify({ name, user_ids: selectedUsers }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      toast.success("Group created successfully");
      onOpenChange(false);
      setName("");
      setSelectedUsers([]);
      if (onSuccess) onSuccess(data.id);
    },
    onError: () => {
      toast.error("Failed to create group");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    if (selectedUsers.length === 0) return toast.error("Select at least one user");
    mutation.mutate();
  };

  const toggleUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
          
          <div className="space-y-2">
            <Label>Select Members</Label>
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
            <Button type="submit" disabled={mutation.isPending || !name.trim() || selectedUsers.length === 0}>
              {mutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
