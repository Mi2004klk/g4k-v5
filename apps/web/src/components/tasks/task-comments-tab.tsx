"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Button, Textarea, Avatar, AvatarFallback } from "@g4k/ui/components";
import { resolveAvatarUrl } from "@/lib/utils";

interface TaskCommentsTabProps {
  taskId: number | string;
  comments: any[];
}

export function TaskCommentsTab({ taskId, comments }: TaskCommentsTabProps) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: comment }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-detail", taskId] });
      setComment("");
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to add comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number | string) => {
      return apiFetch(`/tasks/comments/${commentId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["task-detail", taskId] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to delete comment"),
  });

  return (
    <div className="space-y-4 py-4 flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-2">
            <AppIcon name="chat" className="w-8 h-8 opacity-20" />
            <span className="text-[13px] font-medium">No comments yet</span>
          </div>
        ) : (
          comments.map((c: any) => (
            <div key={c.id} className="flex gap-3 group relative">
              <Avatar className="w-8 h-8 shrink-0 mt-0.5 border border-neutral-200/50 dark:border-neutral-800/50">
                {c.user?.avatar_url && <img src={resolveAvatarUrl(c.user.avatar_url)} alt={c.user?.name} />}
                <AvatarFallback name={c.user?.name} className="text-[10px]" />
              </Avatar>
              <div className="flex-1 min-w-0 bg-neutral-50 dark:bg-neutral-900 rounded-xl rounded-tl-none p-3 border border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-[13px] text-neutral-900 dark:text-neutral-100">{c.user?.name}</span>
                  <span className="text-[11px] font-medium text-neutral-400">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -right-2 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => deleteCommentMutation.mutate(c.id)}
              >
                <AppIcon name="trash" className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className="flex gap-2 items-end pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
        <Textarea 
          ref={commentInputRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..." 
          className="min-h-[44px] max-h-32 text-[13px] resize-none py-3 rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus-visible:ring-primary-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (comment.trim()) addCommentMutation.mutate();
            }
          }}
        />
        <Button 
          className="shrink-0 h-11 w-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          disabled={!comment.trim() || addCommentMutation.isPending}
          onClick={() => addCommentMutation.mutate()}
        >
          {addCommentMutation.isPending ? <AppIcon name="loading" className="animate-spin w-4 h-4" /> : <AppIcon name="send" className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
