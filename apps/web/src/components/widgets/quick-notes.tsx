"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Collapsible, CollapsibleTrigger, CollapsibleContent, ConfirmDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Truncate } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { OneFieldForm } from "@/components/one-field-form";
import { useUIStore } from "@/lib/ui-store";
import { useShallow } from "zustand/react/shallow";
import { queryKeys } from "@/lib/query-keys";

export function QuickNotes() {
  const queryClient = useQueryClient();
  const widgetStates = useUIStore(useShallow((s) => s.widgetStates));
  const toggleWidgetCollapse = useUIStore((s) => s.toggleWidgetCollapse);
  const isCollapsed = widgetStates["quick-notes"]?.collapsed ?? false;
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");

  const { data: notes = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => (Array.isArray(data.quick_notes?.data) ? data.quick_notes.data : (Array.isArray(data.quick_notes) ? data.quick_notes : [])),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiFetch("/quick-notes", {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/quick-notes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: number; pinned: boolean }) => {
      return apiFetch(`/quick-notes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ pinned }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: string }) => {
      return apiFetch(`/quick-notes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      setEditingNoteId(null);
      setEditBody("");
    },
  });

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => toggleWidgetCollapse("quick-notes")}>
      <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[var(--radius)] bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <AppIcon name="fileText" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Quick Scratchpad
            </span>
            {isFetching && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
          </div>
          <CollapsibleTrigger className="h-7 w-7 p-0 flex items-center justify-center rounded-[var(--radius)] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            {isCollapsed ? <AppIcon name="chevronDown" /> : <AppIcon name="chevronUp" />}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <OneFieldForm
                title="Quick Note"
                placeholder="Type a personal note..."
                buttonLabel="Add Note"
                icon="plus"
                onSubmit={(val) => createMutation.mutateAsync(val)}
                isPending={createMutation.isPending}
              />
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto thin-scrollbar pr-1">
              {isPending ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-10 w-full rounded-[var(--radius)]" />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <AppIcon name="warning" size="lg" className=" text-rose-400" />
                  <p className="text-[10px] font-medium text-rose-600">Failed to load notes</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="h-5 text-[10px] px-2">
                    Retry
                  </Button>
                </div>
              ) : !notes || notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <p className="text-xs font-medium text-neutral-400">No notes yet</p>
                </div>
              ) : (
                notes.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-[var(--radius)] text-xs flex flex-col justify-between gap-2 border transition-colors group ${
                      n.pinned 
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' 
                        : 'bg-secondary border-border'
                    }`}
                  >
                    {editingNoteId === n.id ? (
                      <div className="w-full flex flex-col gap-2">
                        <textarea
                          className="w-full text-xs p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 resize-none outline-none focus:ring-1 focus:ring-primary-500"
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                          <Button variant="primary" size="sm" className="h-6 text-[10px] px-2" onClick={() => editMutation.mutate({ id: n.id, body: editBody })} disabled={!editBody.trim() || editMutation.isPending}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between w-full gap-2">
                        <div className="flex-1 min-w-0 flex items-start gap-2">
                          {n.pinned && <AppIcon name="pin" size="xs" className="mt-1 text-amber-500 shrink-0" />}
                          <Truncate text={n.body} className="text-secondary-foreground" />
                        </div>
                        <TooltipProvider delayDuration={150}>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingNoteId(n.id);
                                    setEditBody(n.body);
                                  }}
                                  className="h-5 w-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                  aria-label="Edit note"
                                >
                                  <AppIcon name="edit" size="sm" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Edit note</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => togglePinMutation.mutate({ id: n.id, pinned: !n.pinned })}
                                  className={`h-5 w-5 ${n.pinned ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50' : 'text-neutral-400 hover:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50'}`}
                                  aria-label={n.pinned ? "Unpin note" : "Pin note"}
                                >
                                  <AppIcon name="pin" size="sm" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">{n.pinned ? "Unpin" : "Pin to top"}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setConfirmState({ isOpen: true, id: n.id })}
                                  className="h-5 w-5 text-neutral-400 hover:text-destructive hover:bg-destructive/10"
                                  aria-label="Delete note"
                                >
                                  <AppIcon name="trash" size="sm" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Delete note</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
      
      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, id: null }) }}
        onConfirm={() => {
          if (confirmState.id) {
            deleteMutation.mutate(confirmState.id);
            setConfirmState({ isOpen: false, id: null });
          }
        }}
        title="Delete Note"
        description="Are you sure you want to delete this note?"
        isLoading={deleteMutation.isPending}
      />
    </Collapsible>
  );
}
