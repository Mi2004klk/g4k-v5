"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";
import { QuickNotes } from "@/components/widgets/quick-notes";
import { FeedbackForm } from "@/components/widgets/feedback-form";
import { queryKeys } from "@/lib/query-keys";

export function ChatTab() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { subscribe, leaveChannel } = useReverb();
  
  const initialConvId = searchParams.get("conversation");
  const [selectedId, setSelectedId] = useState<number | null>(initialConvId ? parseInt(initialConvId) : null);

  useEffect(() => {
    if (initialConvId) {
      setSelectedId(parseInt(initialConvId));
    }
  }, [initialConvId]);

  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => apiFetch("/conversations"),
  });

  const { 
    data: messageData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: queryKeys.messages(selectedId as number),
    queryFn: ({ pageParam }) => apiFetch(`/conversations/${selectedId}/messages${pageParam ? `?cursor=${pageParam}` : ''}`),
    getNextPageParam: (lastPage: any) => lastPage.next_cursor || null,
    initialPageParam: null as string | null,
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (!selectedId) return;

    const channelName = `conversation.${selectedId}`;
    const channel = subscribe(channelName, true);
    if (channel) {
      const handler = (e: any) => {
        queryClient.setQueryData(queryKeys.messages(selectedId as number), (old: any) => {
          if (!old?.pages) return old;
          const firstPage = old.pages[0];
          const updatedFirstPage = {
            ...firstPage,
            data: [...firstPage.data, e.message],
          };
          return {
            ...old,
            pages: [updatedFirstPage, ...old.pages.slice(1)],
          };
        });
      };

      channel.listen(".message-sent", handler);

      return () => {
        channel.stopListening(".message-sent");
        leaveChannel(channelName);
      };
    }
  }, [selectedId, queryClient, subscribe, leaveChannel]);

  
  const markReadMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/conversations/${selectedId}/read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
    },
  });

  useEffect(() => {
    if (selectedId) {
      markReadMutation.mutate();
    }
  }, [selectedId]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ body, mentions, attachment }: { body: string; mentions?: number[]; attachment?: File | null }) => {
      if (attachment) {
        const formData = new FormData();
        formData.append("body", body);
        if (mentions?.length) {
          mentions.forEach(m => formData.append("mentions[]", m.toString()));
        }
        formData.append("attachment", attachment);
        
        return apiFetch(`/conversations/${selectedId}/messages`, {
          method: "POST",
          body: formData,
        });
      } else {
        return apiFetch(`/conversations/${selectedId}/messages`, {
          method: "POST",
          body: JSON.stringify({ body, mentions }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });

  const messages = messageData?.pages.flatMap((page: any) => page.data) || [];
  const selectedConv = conversations.find((c: any) => c.id === selectedId);

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Interface */}
        <div className="lg:col-span-2 bg-card dark:bg-neutral-900 rounded-2xl shadow-e1 hover:shadow-e2 transition-shadow duration-150 border border-neutral-100 dark:border-neutral-800 flex h-[calc(100vh-200px)] min-h-[500px] overflow-hidden">
          {/* Conversation sidebar */}
          <div className={`w-full md:w-1/3 border-r border-neutral-100 dark:border-neutral-800 flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
              Chats
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                currentUserId={user?.id as number}
                conversations={conversations}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
              />
            </div>
          </div>

          {/* Active Chat Area */}
          <div className={`flex-1 flex flex-col bg-neutral-50/50 dark:bg-neutral-900/50 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
            {selectedId ? (
              <>
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-card dark:bg-neutral-900 flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="md:hidden p-0 h-8 w-8" onClick={() => setSelectedId(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      {selectedConv?.type === 'direct' 
                        ? selectedConv?.participants?.find((p: any) => p.id !== user?.id)?.name 
                        : selectedConv?.name}
                    </h3>
                  </div>
                </div>

                <MessageList 
                  messages={messages} 
                  currentUserId={user?.id || 0} 
                  onFetchNextPage={() => fetchNextPage()}
                  hasNextPage={!!hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />

                <MessageComposer
                  onSend={(body, mentions, attachment) => sendMessageMutation.mutate({ body, mentions, attachment })}
                  disabled={sendMessageMutation.isPending}
                  conversation={selectedConv}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                <MessageSquare className="w-10 h-10 text-neutral-300 mb-2" />
                <p className="text-xs font-medium">Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <AnnouncementBoard />
          <QuickNotes />
          <FeedbackForm />
        </div>
      </div>
    </div>
  );
}
