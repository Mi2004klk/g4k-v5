"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { StickyNote, Plus, Trash2, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Collapsible, CollapsibleTrigger, CollapsibleContent } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { useUIStore } from "@/lib/ui-store";
import { useShallow } from "zustand/react/shallow";
import { queryKeys } from "@/lib/query-keys";

export function QuickNotes() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const widgetStates = useUIStore(useShallow((s) => s.widgetStates));
  const toggleWidgetCollapse = useUIStore((s) => s.toggleWidgetCollapse);
  const isCollapsed = widgetStates["quick-notes"]?.collapsed ?? false;

  const { data: notes = [], isPending, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
    select: (data: any) => data.quick_notes,
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
      setText("");
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

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => toggleWidgetCollapse("quick-notes")}>
      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-amber-500" />
            Quick Scratchpad
            {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          </CardTitle>
          <CollapsibleTrigger className="h-7 w-7 p-0 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Type a personal note..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                size="sm"
                onClick={() => createMutation.mutate(text)}
                disabled={!text.trim()}
                className="h-8"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {isPending ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <p className="text-[10px] font-medium text-rose-600">Failed to load notes</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="h-5 text-[10px] px-2">
                    Retry
                  </Button>
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <p className="text-xs font-medium text-neutral-400">No notes yet</p>
                </div>
              ) : (
                notes.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-secondary text-xs flex items-start justify-between gap-2 border border-border"
                  >
                    <p className="text-secondary-foreground">{n.body}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(n.id)}
                      className="h-5 w-5 text-neutral-400 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
