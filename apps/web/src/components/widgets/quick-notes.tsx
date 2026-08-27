"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Card, Skeleton, Collapsible, CollapsibleTrigger, CollapsibleContent, ConfirmDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Truncate, Input } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@g4k/ui/components";
import { OneFieldForm } from "@/components/one-field-form";
import { useUIStore } from "@/lib/ui-store";
import { useShallow } from "zustand/react/shallow";
import { queryKeys } from "@/lib/query-keys";

export interface Note {
  id: number;
  body: string;
  pinned: boolean;
  created_at?: string;
  updated_at?: string;
}

export function QuickNotes() {
  const queryClient = useQueryClient();
  const widgetStates = useUIStore(useShallow((s) => s.widgetStates));
  const toggleWidgetCollapse = useUIStore((s) => s.toggleWidgetCollapse);
  const isCollapsed = widgetStates["quick-notes"]?.collapsed ?? false;
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notes = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => (Array.isArray(data?.quick_notes?.data) ? data.quick_notes.data : (Array.isArray(data?.quick_notes) ? data.quick_notes : [])),
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

  const sortedAndFilteredNotes = useMemo(() => {
    let filtered = notes;
    if (searchQuery) {
      filtered = notes.filter((n: Note) => n.body.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    // Sort pinned first, then by date (newest first)
    return [...filtered].sort((a: Note, b: Note) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [notes, searchQuery]);

  const renderNoteCard = (n: Note, isExpanded: boolean = false) => (
    <div
      key={n.id}
      className={`p-3 rounded-lg text-sm flex flex-col justify-between gap-3 border transition-colors group ${
        n.pinned 
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' 
          : 'bg-secondary border-border'
      }`}
    >
      {editingNoteId === n.id ? (
        <div className="w-full flex flex-col gap-2">
          <textarea
            className="w-full text-sm p-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 resize-none outline-none focus:ring-2 focus:ring-primary-500"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => editMutation.mutate({ id: n.id, body: editBody })} disabled={!editBody.trim() || editMutation.isPending}>Save</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between w-full gap-3">
          <div className="flex-1 min-w-0 flex items-start gap-2">
            {n.pinned && <AppIcon name="pin" size="xs" className="mt-1 text-amber-500 shrink-0" />}
            {isExpanded ? (
              <div className="text-secondary-foreground whitespace-pre-wrap">{n.body}</div>
            ) : (
              <Truncate text={n.body} className="text-secondary-foreground text-xs" />
            )}
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
                    className="h-6 w-6 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
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
                    className={`h-6 w-6 ${n.pinned ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50' : 'text-neutral-400 hover:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50'}`}
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
                    className="h-6 w-6 text-neutral-400 hover:text-destructive hover:bg-destructive/10"
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
  );

  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={() => toggleWidgetCollapse("quick-notes")}>
        <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150 relative">
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
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs px-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hidden sm:flex"
                onClick={() => setIsModalOpen(true)}
              >
                View All
              </Button>
              <CollapsibleTrigger className="h-7 w-7 p-0 flex items-center justify-center rounded-[var(--radius)] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {isCollapsed ? <AppIcon name="chevronDown" /> : <AppIcon name="chevronUp" />}
              </CollapsibleTrigger>
            </div>
          </div>
          
          <CollapsibleContent className="flex-1 flex flex-col min-h-0">
            <div className="space-y-3 pt-2 flex-1 flex flex-col min-h-0">
              <div className="flex gap-2 shrink-0">
                <OneFieldForm
                  title="Quick Note"
                  placeholder="Type a personal note..."
                  buttonLabel="Add Note"
                  icon="plus"
                  onSubmit={(val) => createMutation.mutateAsync(val)}
                  isPending={createMutation.isPending}
                />
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto thin-scrollbar pr-1 min-h-0">
                {isPending ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-10 w-full rounded-[var(--radius)]" />
                    ))}
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <AppIcon name="warning" size="lg" className=" text-rose-400" />
                    <p className="text-xs font-medium text-rose-600">Failed to load notes</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="h-5 text-xs px-2">
                      Retry
                    </Button>
                  </div>
                ) : !notes || notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <p className="text-xs font-medium text-neutral-400">No notes yet</p>
                  </div>
                ) : (
                  sortedAndFilteredNotes.slice(0, 5).map((n: Note) => renderNoteCard(n, false))
                )}
              </div>
              
              {notes.length > 5 && (
                <div className="pt-2 border-t border-border mt-2 text-center sm:hidden">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary-600 dark:text-primary-400 w-full"
                    onClick={() => setIsModalOpen(true)}
                  >
                    View All {notes.length} Notes
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Full Screen View All Notes Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <AppIcon name="fileText" className="text-amber-600 dark:text-amber-500" size="md" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl">All Quick Notes</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5 font-normal">Manage your personal scratchpad</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 shrink-0 bg-muted/30 border-b border-border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <OneFieldForm
                  title="Quick Note"
                  placeholder="Type a new note..."
                  buttonLabel="Add Note"
                  icon="plus"
                  onSubmit={(val) => createMutation.mutateAsync(val)}
                  isPending={createMutation.isPending}
                />
              </div>
              <div className="relative w-full md:w-64 shrink-0">
                <AppIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size="sm" />
                <Input 
                  placeholder="Search notes..." 
                  className="pl-9 h-10 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
            {sortedAndFilteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                <AppIcon name="fileText" size="3xl" className="text-neutral-200 dark:text-neutral-800 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">No notes found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery ? "Try adjusting your search query." : "Your scratchpad is empty. Add a note above to get started."}
                </p>
                {searchQuery && (
                  <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                {sortedAndFilteredNotes.map((n: Note) => (
                  <div key={n.id} className="h-fit">
                    {renderNoteCard(n, true)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
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
    </>
  );
}
