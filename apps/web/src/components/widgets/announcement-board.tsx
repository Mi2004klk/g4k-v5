"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { usePusher } from "@/hooks/use-pusher";
import { AppIcon } from "@g4k/ui/components";
import { safeFormat } from "@/lib/format";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Card, Button, Skeleton, ConfirmDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";
import { hasCapability, useCapabilities } from "@/lib/capabilities";
import { useUIStore } from "@/lib/ui-store";
import { AnnouncementComposer } from "./announcement-composer";

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
  const dismissWidget = useUIStore((s) => s.dismissWidget);
  const caps = useCapabilities();
  const canManage = hasCapability(caps.data, "announcements.manage");

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<{title: string, body: string, scope: string, priority: string, pinned: boolean} | undefined>();

  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  const { data: announcements = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => (Array.isArray(data?.announcements?.data) ? data.announcements.data : (Array.isArray(data?.announcements) ? data.announcements : [])),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const { subscribe, leaveChannel } = usePusher();

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
      setConfirmState({ isOpen: false, id: null });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/announcements/${id}/dismiss`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const emojis = [
    { key: "like", label: "👍" },
    { key: "heart", label: "❤️" },
    { key: "party", label: "🎉" },
  ];

  const pinnedAnnouncements = announcements.filter((a: Announcement) => a.pinned_at);
  const unpinnedAnnouncements = announcements.filter((a: Announcement) => !a.pinned_at);

  const renderAnnouncement = (item: Announcement) => {
    const reactions = item.reactions || {};
    const isPinned = Boolean(item.pinned_at);

    return (
      <div
        key={item.id}
        className={`p-4 rounded-xl space-y-3 border transition-all ${
          isPinned 
            ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm' 
            : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {isPinned && <AppIcon name="pin" size="xs" className=" text-amber-500 fill-amber-500 shrink-0" />}
            <h4 className="text-[14px] font-bold text-neutral-900 dark:text-white leading-snug truncate">
              {item.title}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              item.scope === 'company' 
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400' 
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            }`}>
              {item.scope === 'company' ? 'Company' : 'Team'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-neutral-400 font-medium">
              {safeFormat(item.created_at, "MMM d")}
            </span>
            {canManage && (
              <div className="flex items-center gap-0.5">
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissMutation.mutate(item.id)}
                        aria-label="Dismiss Announcement"
                        className="h-6 w-6 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      >
                        <AppIcon name="close" size="xs" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Dismiss</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(item.id);
                          setInitialData({ title: item.title, body: item.body, scope: item.scope || "company", priority: "normal", pinned: isPinned });
                          setShowCreate(true);
                        }}
                        aria-label="Edit Announcement"
                        className="h-6 w-6 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      >
                        <AppIcon name="edit" size="xs" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Edit</TooltipContent>
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
                        className={`h-6 w-6 transition-colors ${
                          isPinned ? "text-amber-500 hover:text-amber-600" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        }`}
                      >
                        <AppIcon name="pin" size="xs" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">{isPinned ? "Unpin" : "Pin"}</TooltipContent>
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
                        className="h-6 w-6 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <AppIcon name="trash" size="xs" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {item.body}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
            <AppIcon name="profile" size="xs" />
            By {item.creator?.name || "Management"}
          </span>

          <div className="flex items-center gap-1.5">
            {emojis.map(({ key, label }) => {
              const uids: number[] = Array.isArray(reactions[key]) ? reactions[key] : [];
              const count = uids.length;
              const hasReacted = user?.id ? uids.includes(user.id) : false;

              return (
                <button
                  key={key}
                  onClick={() => reactMutation.mutate({ id: item.id, emoji: key })}
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all ${
                    hasReacted
                      ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-800 shadow-sm"
                      : "bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium border border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <span className="text-sm leading-none">{label}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md rounded-xl p-4 sm:p-5 flex flex-col transition-shadow duration-150 group overflow-hidden">
      <div className="flex items-center justify-between pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[4px] bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
            <AppIcon name="announcement" className="text-orange-600 dark:text-orange-400 w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            Company Announcements
          </span>
          {isFetching && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs px-2.5">
                Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => { setEditingId(null); setInitialData(undefined); setShowCreate(true); }} className="h-7 text-xs px-2.5 shadow-sm">
                <AppIcon name="plus" size="xs" className="mr-1" /> Post
              </Button>
            </>
          )}
          <button 
            type="button"
            aria-label="Dismiss widget"
            onClick={() => dismissWidget("announcements")}
            className="p-1 text-neutral-400 hover:text-rose-500 transition-colors ml-1" 
            title="Remove widget"
          >
            <AppIcon name="close" size="sm" />
          </button>
        </div>
      </div>
      
      <AnnouncementComposer
        open={showCreate}
        onOpenChange={setShowCreate}
        editingId={editingId}
        initialData={initialData}
      />
      <div className="flex-1 overflow-y-auto thin-scrollbar pr-1 -mr-1 relative min-h-[200px]">
        {isPending ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 h-24 rounded-lg w-full" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 h-full min-h-[150px]">
            <AppIcon name="announcement" size="lg" className="text-neutral-300 dark:text-neutral-700 mb-2" />
            <p className="text-xs font-bold text-neutral-500">No announcements yet</p>
            <p className="text-xs text-neutral-400 mt-1 mb-3">Check back later for updates</p>
            {canManage && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setInitialData(undefined); setEditingId(null); setShowCreate(true); }}>
                Post Announcement
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pinnedAnnouncements.length > 0 && (
              <div className="space-y-3">
                {pinnedAnnouncements.map(renderAnnouncement)}
              </div>
            )}
            {unpinnedAnnouncements.length > 0 && (
              <div className="space-y-3">
                {pinnedAnnouncements.length > 0 && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1"></div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Recent</span>
                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1"></div>
                  </div>
                )}
                {unpinnedAnnouncements.map(renderAnnouncement)}
              </div>
            )}
          </div>
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
