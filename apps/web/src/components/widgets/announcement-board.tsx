"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Loader2, Megaphone, Trash2, Pin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";

export function AnnouncementBoard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdminOrHr = user?.active_role === "super_admin" || user?.active_role === "hr";

  const { data: announcements = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.announcements,
    queryFn: () => apiFetch("/announcements"),
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

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-warning" />
            Company Announcements
          </span>
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          {isAdminOrHr && (
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
              Refresh
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
        {isLoading ? (
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => pinMutation.mutate({ id: item.id, pinned: !isPinned })}
                          title={isPinned ? "Unpin Announcement" : "Pin Announcement"}
                          className={`h-5 w-5 transition-colors ${
                            isPinned ? "text-warning hover:text-warning/80" : "text-neutral-400 hover:text-neutral-600"
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          title="Delete Announcement"
                          className="h-5 w-5 text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
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
      </CardContent>
    </Card>
  );
}
