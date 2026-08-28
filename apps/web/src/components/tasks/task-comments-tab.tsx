"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AppIcon, Spinner,
  IconButton,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Button, Textarea, Avatar, AvatarFallback, ConfirmDialog } from "@g4k/ui/components";
import { resolveAvatarUrl } from "@/lib/utils";

interface TaskCommentsTabProps {
  taskId: number | string;
  comments: any[];
}

export function TaskCommentsTab({ taskId, comments }: TaskCommentsTabProps) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment, parent_id: replyTo }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: ["task-detail", taskId] });
      setComment("");
      setReplyTo(null);
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
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
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
          (() => {
            const topLevel = comments.filter(c => !c.parent_id);
            const repliesByParent = comments.reduce((acc, c) => {
              if (c.parent_id) {
                if (!acc[c.parent_id]) acc[c.parent_id] = [];
                acc[c.parent_id].push(c);
              }
              return acc;
            }, {} as Record<number, any[]>);

            const renderComment = (c: any, isReply = false) => (
              <div key={c.id} className={`flex gap-3 group relative ${isReply ? 'ml-11 mt-3' : 'mt-4'}`}>
                <Avatar className="w-8 h-8 shrink-0 mt-0.5 border border-neutral-200/50 dark:border-neutral-800/50">
                  {c.user?.avatar_url && <img src={resolveAvatarUrl(c.user.avatar_url)} alt={c.user?.name} />}
                  <AvatarFallback name={c.user?.name} className="text-xs" />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl rounded-tl-none p-3 border border-neutral-100 dark:border-neutral-800">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[13px] text-neutral-900 dark:text-neutral-100">{c.user?.name}</span>
                      <span className="text-xs font-medium text-neutral-400">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[13px] text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1.5 ml-1">
                    {!isReply && (
                      <button 
                        onClick={() => {
                          setReplyTo(c.id);
                          commentInputRef.current?.focus();
                        }}
                        className="text-xs font-semibold text-neutral-500 hover:text-primary-600 transition-colors"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                  
                  {repliesByParent[c.id]?.map((reply: any) => renderComment(reply, true))}
                </div>
                
                <ConfirmDialog
                  title="Delete Comment"
                  description="Are you sure you want to delete this comment?"
                  onConfirm={() => deleteCommentMutation.mutate(c.id)}
                  trigger={
                    <IconButton aria-label="Button" variant="ghost" className="absolute -right-2 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" icon="trash" />
                  }
                />
              </div>
            );
            return topLevel.map(c => renderComment(c));
          })()
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
        {replyTo && (
          <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-950/30 px-3 py-1.5 rounded-md">
            <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
              Replying to comment...
            </span>
            <button 
              onClick={() => setReplyTo(null)}
              className="text-primary-500 hover:text-primary-700"
            >
              <AppIcon name="close" size="xs" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
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
          className="shrink-0 h-11 w-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white"
          disabled={!comment.trim() || addCommentMutation.isPending}
          onClick={() => addCommentMutation.mutate()}
        >
          {addCommentMutation.isPending ? <Spinner className="w-4 h-4" /> : <AppIcon name="send" className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
