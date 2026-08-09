"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export function QuickNotes() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["quick-notes"],
    queryFn: () => apiFetch("/quick-notes"),
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
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/quick-notes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
    },
  });

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" />
          Quick Scratchpad
        </CardTitle>
      </CardHeader>
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
            className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {notes.map((n: any) => (
            <div
              key={n.id}
              className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-start justify-between gap-2 border border-amber-100 dark:border-amber-900/50"
            >
              <p className="text-neutral-800 dark:text-neutral-200">{n.body}</p>
              <button
                onClick={() => deleteMutation.mutate(n.id)}
                className="text-neutral-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
