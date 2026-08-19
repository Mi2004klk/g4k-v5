"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { useReverb } from "@/hooks/use-reverb";
import { AppIcon } from "@g4k/ui/components";
import { safeFormat } from "@/lib/format";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Card, Button, Skeleton, ConfirmDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { useFormDraft } from "@/hooks/use-form-draft";
import { Alert, AlertDescription, AlertTitle } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { hasCapability, useCapabilities } from "@/lib/capabilities";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  scope?: string;
  pinned_at?: string | null;
  created_at: string;
  creator?: { name: string };
  reactions?: Record<string, number[]>;
}

export function AnnouncementBoard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const caps = useCapabilities();
  const canManage = hasCapability(caps.data, "announcements.manage");

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createData, setCreateData] = useState({ title: "", body: "", scope: "company", pinned: false });

  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("announcement_create", { title: "", body: "", scope: "company", pinned: false });

  const activeCreateData = {
    title: createData.title || draftData.title,
    body: createData.body || draftData.body,
    scope: createData.scope !== "company" ? createData.scope : draftData.scope,
    pinned: createData.pinned !== false ? createData.pinned : draftData.pinned,
  };

  const handleFieldChange = (updates: any) => {
    setDraftData({
      title: createData.title || draftData.title,
      body: createData.body || draftData.body,
      scope: createData.scope !== "company" ? createData.scope : draftData.scope,
      pinned: createData.pinned !== false ? createData.pinned : draftData.pinned,
      ...updates
    });
  };

  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  const { data: announcements = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => (Array.isArray(data?.announcements?.data) ? data.announcements.data : (Array.isArray(data?.announcements) ? data.announcements : [])),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const { subscribe, leaveChannel } = useReverb();

  // Reverb real-time subscription
  useEffect(() => {
    const channelName = "org.announcements";
    const channel = subscribe(channelName, true);
    if (channel) {
      channel.listen(".AnnouncementPosted", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      });
    }
    return () => {
      if (channel) {
        channel.stopListening(".AnnouncementPosted");
      }
      leaveChannel(channelName);
    };
  }, [subscribe, leaveChannel, queryClient]);

  const reactMutation = useMutation({
    mutationFn: async ({ id, emoji }: { id: number; emoji: string }) => {
      return apiFetch(`/announcements/${id}/react`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/announcements/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      toast.success("Announcement deleted");
    },
  });

  const emojis = [
    { key: "like", label: "👍" },
    { key: "heart", label: "❤️" },
    { key: "party", label: "🎉" },
  ];

  const createMutation = useMutation({
    mutationFn: async (data: typeof createData & { id?: number }) => {
      const url = data.id ? `/announcements/${data.id}` : "/announcements";
      const method = data.id ? "PUT" : "POST";
      return apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      setShowCreate(false);
      setEditingId(null);
      setCreateData({ title: "", body: "", scope: "company", pinned: false }); clearDraft();;
      toast.success("Announcement posted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to post announcement");
    }
  });

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col transition-shadow duration-150">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[var(--radius)] bg-warning/20 flex items-center justify-center">
            <AppIcon name="announcement" className=" text-warning" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Company Announcements
          </span>
          {isFetching && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-[11px] px-2.5">
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setEditingId(null); setCreateData({ title: "", body: "", scope: "company", pinned: false }); clearDraft();; setShowCreate(true); }} className="h-7 text-[11px] px-2.5">
              Post
            </Button>
          </div>
        )}
      </div>
      
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setEditingId(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Announcement" : "Post Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <input
                id="title"
                value={editingId ? createData.title : activeCreateData.title}
                onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                className="flex h-10 w-full rounded-[var(--radius)] border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-50 dark:focus:ring-orange-400 dark:focus:ring-offset-neutral-900"
                placeholder="Announcement title"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium">Message</label>
              <textarea
                id="body"
                value={editingId ? createData.body : activeCreateData.body}
                onChange={(e) => setCreateData({ ...createData, body: e.target.value })}
                className="flex min-h-[80px] w-full rounded-[var(--radius)] border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-50 dark:focus:ring-orange-400 dark:focus:ring-offset-neutral-900"
                placeholder="Announcement body"
              />
            </div>
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={editingId ? createData.pinned : activeCreateData.pinned}
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
              onClick={() => createMutation.mutate({ ...createData, id: editingId || undefined })} 
              disabled={createMutation.isPending || !createData.title || !createData.body}
            >
              {createMutation.isPending && <AppIcon name="loading" className="mr-2 animate-spin" />}
              {editingId ? "Save" : "Post"}
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
            <AppIcon name="warning" size="xl" className=" text-rose-400" />
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
          announcements.map((item: Announcement) => {
            const reactions = item.reactions || {};
            const isPinned = Boolean(item.pinned_at);

            return (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-white dark:bg-neutral-950 space-y-2 border border-neutral-200 dark:border-neutral-800 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-[13px] font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 leading-snug">
                    {isPinned && <AppIcon name="pin" size="xs" className=" text-amber-500 fill-amber-500 shrink-0" />}
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400">
                      {safeFormat(item.created_at, "MMM d")}
                    </span>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setCreateData({ title: item.title, body: item.body, scope: item.scope || "company", pinned: isPinned });
                                  setShowCreate(true);
                                }}
                                aria-label="Edit Announcement"
                                className="h-5 w-5 text-neutral-400 hover:text-neutral-600 transition-colors"
                              >
                                <AppIcon name="edit" size="xs" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Edit Announcement</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                                <AppIcon name="pin" size="xs" />
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
                                <AppIcon name="trash" size="xs" />
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
                      const uids: number[] = Array.isArray(reactions[key]) ? reactions[key] : [];
                      const count = uids.length;
                      const hasReacted = user?.id ? uids.includes(user.id) : false;

                      return (
                        <button
                          key={key}
                          onClick={() => reactMutation.mutate({ id: item.id, emoji: key })}
                          className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 transition-colors border-none ${
                            hasReacted
                              ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-bold"
                              : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 font-medium"
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
