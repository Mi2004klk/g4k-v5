"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { Loader2, Megaphone, Trash2, Pin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton, ConfirmDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";

export function AnnouncementBoard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdminOrHr = user?.active_role === "super_admin" || user?.active_role === "hr";

  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: "", body: "", scope: "company", pinned: false });
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  const { data: announcements = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => data.announcements,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  // Reverb real-time subscription
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Echo) {
      const channel = (window as any).Echo.channel("public-announcements");
      channel.listen(".AnnouncementPosted", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      });
      return () => {
        channel.stopListening(".AnnouncementPosted");
      };
    }
  }, [queryClient]);

  const reactMutation = useMutation({
    mutationFn: async ({ id, emoji }: { id: number; emoji: string }) => {
      return apiFetch(`/announcements/${id}/react`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: number; pinned: boolean }) => {
      return apiFetch(`/announcements/${id}`, {
        method: "PUT",
        body: JSON.stringify({ pinned }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/announcements/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      toast.success("Announcement deleted");
    },
  });

  const emojis = [
    { key: "like", label: "👍" },
    { key: "heart", label: "❤️" },
    { key: "party", label: "🎉" },
  ];

  const createMutation = useMutation({
    mutationFn: async (data: typeof createData) => {
      return apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      setShowCreate(false);
      setCreateData({ title: "", body: "", scope: "company", pinned: false });
      toast.success("Announcement posted");
    },
  });

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-warning/20 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-warning" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Company Announcements
          </span>
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
        </div>
        {isAdminOrHr && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)} className="h-6 text-[10px] px-2">
              Post
            </Button>
          </div>
        )}
      </div>
      
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <input
                id="title"
                value={createData.title}
                onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-50 dark:focus:ring-orange-400 dark:focus:ring-offset-neutral-900"
                placeholder="Announcement title"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium">Message</label>
              <textarea
                id="body"
                value={createData.body}
                onChange={(e) => setCreateData({ ...createData, body: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-50 dark:focus:ring-orange-400 dark:focus:ring-offset-neutral-900"
                placeholder="Announcement body"
              />
            </div>
            {user?.active_role === "super_admin" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="scope"
                  checked={createData.scope === "company"}
                  onChange={(e) => setCreateData({ ...createData, scope: e.target.checked ? "company" : "team" })}
                  className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="scope" className="text-sm font-medium">Company-wide (vs Team-only)</label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={createData.pinned}
                onChange={(e) => setCreateData({ ...createData, pinned: e.target.checked })}
                className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="pinned" className="text-sm font-medium">Pin to top</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(createData)} 
              disabled={createMutation.isPending || !createData.title || !createData.body}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex-1 space-y-3 max-h-[350px] overflow-y-auto thin-scrollbar">
        {isPending ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-2 border border-neutral-100 dark:border-neutral-800">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load announcements</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
              Retry
            </Button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <p className="text-xs font-medium text-neutral-400">No announcements yet</p>
          </div>
        ) : (
          announcements.map((item: any) => {
            const reactions = item.reactions || {};
            const isPinned = Boolean(item.pinned_at);

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-2 border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    {isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400">
                      {format(new Date(item.created_at), "MMM d")}
                    </span>
                    {isAdminOrHr && (
                      <div className="flex items-center gap-1">
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => pinMutation.mutate({ id: item.id, pinned: !isPinned })}
                                aria-label={isPinned ? "Unpin Announcement" : "Pin Announcement"}
                                className={`h-5 w-5 transition-colors ${
                                  isPinned ? "text-warning hover:text-warning/80" : "text-neutral-400 hover:text-neutral-600"
                                }`}
                              >
                                <Pin className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">{isPinned ? "Unpin Announcement" : "Pin Announcement"}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmState({ isOpen: true, id: item.id })}
                                aria-label="Delete Announcement"
                                className="h-5 w-5 text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Delete Announcement</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {item.body}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50 text-[10px]">
                  <span className="text-neutral-400 font-medium">
                    By {item.creator?.name || "Management"}
                  </span>

                  <div className="flex items-center gap-1">
                    {emojis.map(({ key, label }) => {
                      const uids: number[] = reactions[key] || [];
                      const count = uids.length;
                      const hasReacted = user?.id ? uids.includes(user.id) : false;

                      return (
                        <button
                          key={key}
                          onClick={() => reactMutation.mutate({ id: item.id, emoji: key })}
                          className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-colors ${
                            hasReacted
                              ? "bg-secondary border-border-strong font-bold"
                              : "bg-transparent border-transparent hover:bg-muted"
                          }`}
                        >
                          <span>{label}</span>
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, id: null }) }}
        onConfirm={() => {
          if (confirmState.id) {
            deleteMutation.mutate(confirmState.id);
            setConfirmState({ isOpen: false, id: null });
          }
        }}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement?"
        isLoading={deleteMutation.isPending}
      />
    </Card>
  );
}
