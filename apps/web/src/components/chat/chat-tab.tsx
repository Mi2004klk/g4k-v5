"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { CreateGroupDialog } from "@/components/chat/create-group-dialog";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";
import { QuickNotes } from "@/components/widgets/quick-notes";
import { queryKeys } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";


export function ChatTab() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { subscribe, leaveChannel, isConnected } = useReverb();
  const { data: caps = [] } = useCapabilities();
  const canManageChat = hasCapability(caps, "chat.manage");

  // Mirrors the backend gate: only users.manage (HR) or projects.manage (Admin)
  // may pin/unpin messages in conversations.
  const canPinMessages = hasCapability(caps, "chat.manage") || hasCapability(caps, "projects.manage");

  const initialConvId = searchParams.get("conversation");
  const [selectedId, setSelectedId] = useState<number | null>(initialConvId ? parseInt(initialConvId) : null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  // Mobile keyboard handling (T-47.9): keep the composer above the on-screen
  // keyboard by shrinking the chat container by the hidden viewport height.
  // visualViewport is undefined on desktop — no adjustment is applied there.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const onViewportResize = () => {
      setKeyboardHeight(Math.max(0, Math.round(window.innerHeight - viewport.height)));
    };

    viewport.addEventListener("resize", onViewportResize);
    onViewportResize();
    return () => viewport.removeEventListener("resize", onViewportResize);
  }, []);

  useEffect(() => {
    if (initialConvId) {
      setSelectedId(parseInt(initialConvId));
    }
  }, [initialConvId]);

  const [searchQuery, setSearchQuery] = useState("");

  const { 
    data: rawConversationsData,
    fetchNextPage: fetchNextConversations,
    hasNextPage: hasNextConversations,
    isFetchingNextPage: isFetchingNextConversations
  } = useInfiniteQuery({
    queryKey: [...queryKeys.conversations, searchQuery],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.append("cursor", pageParam as string);
      if (searchQuery) params.append("search", searchQuery);
      return apiFetch(`/conversations?${params.toString()}`);
    },
    getNextPageParam: (lastPage: any) => lastPage.next_cursor || null,
    initialPageParam: null as string | null,
    refetchInterval: isConnected ? false : 15_000,
  });

  const allConversations = rawConversationsData?.pages?.flatMap((page: any) => (Array.isArray(page?.data) ? page.data : (Array.isArray(page) ? page : []))) || [];
  
  // Sort conversations: unread first, then by latest message date
  const conversations = [...allConversations].sort((a: any, b: any) => {
    const aCurrentUserData = a.users?.find((u: any) => u.id === user?.id);
    const aLastReadAt = aCurrentUserData?.pivot?.last_read_at;
    const aIsUnread = (a.unread_count && a.unread_count > 0) || (a.latestMessage &&
      a.latestMessage.sender_id !== user?.id &&
      (!aLastReadAt || new Date(a.latestMessage.created_at) > new Date(aLastReadAt)));

    const bCurrentUserData = b.users?.find((u: any) => u.id === user?.id);
    const bLastReadAt = bCurrentUserData?.pivot?.last_read_at;
    const bIsUnread = (b.unread_count && b.unread_count > 0) || (b.latestMessage &&
      b.latestMessage.sender_id !== user?.id &&
      (!bLastReadAt || new Date(b.latestMessage.created_at) > new Date(bLastReadAt)));

    if (aIsUnread && !bIsUnread) return -1;
    if (!aIsUnread && bIsUnread) return 1;

    const aTime = a.latestMessage ? new Date(a.latestMessage.created_at).getTime() : 0;
    const bTime = b.latestMessage ? new Date(b.latestMessage.created_at).getTime() : 0;
    return bTime - aTime;
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
    refetchInterval: isConnected ? false : 15_000,
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
            data: [e.message, ...firstPage.data],
          };
          return {
            ...old,
            pages: [updatedFirstPage, ...old.pages.slice(1)],
          };
        });
      };

      channel.listen(".message-sent", handler);

      const readHandler = (e: any) => {
        // Optimistically update cache to mark messages as read
        if (e.userId) {
          queryClient.setQueryData(queryKeys.messages(selectedId as number), (old: any) => {
            if (!old?.pages) return old;
            
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.map((msg: any) => {
                  // Mark as read if the message was sent by someone other than the reader
                  if (msg.sender_id !== e.userId) {
                    const currentReads = msg.reads || [];
                    if (!currentReads.find((r: any) => r.user_id === e.userId)) {
                      return { ...msg, reads: [...currentReads, { user_id: e.userId }] };
                    }
                  }
                  return msg;
                })
              }))
            };
          });
        }
      };

      channel.listen(".message-read", readHandler);

      return () => {
        channel.stopListening(".message-sent");
        channel.stopListening(".message-read");
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

  const selectedConv = conversations.find((c: any) => c.id === selectedId);
  const unreadCount = selectedConv?.unread_count || 0;

  useEffect(() => {
    if (selectedId && unreadCount > 0 && !markReadMutation.isPending) {
      markReadMutation.mutate();
    }
  }, [selectedId, unreadCount]);

  const pinMutation = useMutation({
    mutationFn: async (msgId: number) => {
      return apiFetch(`/conversations/${selectedId}/messages/${msgId}/pin`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
    }
  });

  const unpinMutation = useMutation({
    mutationFn: async (msgId: number) => {
      return apiFetch(`/conversations/${selectedId}/messages/${msgId}/unpin`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
    }
  });

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
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(selectedId as number) });
      const previousMessages = queryClient.getQueryData(queryKeys.messages(selectedId as number));
      
      const optimisticMessage = {
        id: Date.now(),
        conversation_id: selectedId,
        sender_id: user?.id,
        body: newMsg.body,
        created_at: new Date().toISOString(),
        sender: user,
        pending: true
      };

      queryClient.setQueryData(queryKeys.messages(selectedId as number), (old: any) => {
        if (!old?.pages) return old;
        const firstPage = old.pages[0];
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: [optimisticMessage, ...firstPage.data],
            },
            ...old.pages.slice(1),
          ],
        };
      });

      return { previousMessages };
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.messages(selectedId as number), context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });

  const messages = messageData?.pages?.flatMap((page: any) => Array.isArray(page?.data) ? page.data : []).reverse() || [];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Interface */}
        <div
          className="lg:col-span-2 bg-card dark:bg-neutral-900 rounded-2xl shadow-e1 hover:shadow-e2 transition-shadow duration-150 border border-neutral-100 dark:border-neutral-800 flex h-[calc(100dvh-200px)] min-h-[500px] overflow-hidden"
          style={keyboardHeight > 0 ? { height: `calc(100dvh - 200px - ${keyboardHeight}px)`, minHeight: 0 } : undefined}
        >
          {/* Conversation sidebar */}
          <div className={`w-full md:w-1/3 border-r border-neutral-100 dark:border-neutral-800 flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span>Chats</span>
                {canManageChat && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-11 w-11 sm:h-7 sm:w-7 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 shrink-0"
                    aria-label="New group chat"
                    title="New Group"
                    onClick={() => setGroupDialogOpen(true)}
                  >
                    <AppIcon name="plus" />
                  </Button>
                )}
              </div>
              <div className="relative">
                <AppIcon name="search" size="xs" className="absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-neutral-100 dark:bg-neutral-800 border-transparent focus:border-primary-500 rounded-md outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                currentUserId={user?.id as number}
                conversations={conversations}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                hasNextPage={hasNextConversations}
                isFetchingNextPage={isFetchingNextConversations}
                fetchNextPage={fetchNextConversations}
              />
            </div>
          </div>

          {/* Active Chat Area */}
          <div className={`flex-1 flex flex-col bg-neutral-50/50 dark:bg-neutral-900/50 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
            {selectedId ? (
              <>
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-card dark:bg-neutral-900 flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="md:hidden p-0 h-11 w-11 sm:h-8 sm:w-8" onClick={() => setSelectedId(null)}>
                    <AppIcon name="arrowLeft" />
                  </Button>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      {selectedConv?.scope === 'direct' 
                        ? selectedConv?.users?.find((p: any) => p.id !== user?.id)?.name 
                        : selectedConv?.name}
                    </h3>
                  </div>
                  {!isConnected && (
                    <span
                      className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 text-[10px] font-semibold shrink-0"
                      title="Real-time connection lost — falling back to periodic refresh"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Not connected
                    </span>
                  )}
                </div>

                <MessageList 
                  messages={messages} 
                  currentUserId={user?.id || 0} 
                  onFetchNextPage={() => fetchNextPage()}
                  hasNextPage={!!hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onPinMessage={(msgId) => pinMutation.mutate(msgId)}
                  onUnpinMessage={(msgId) => unpinMutation.mutate(msgId)}
                  canManage={canPinMessages}
                  onMarkRead={() => markReadMutation.mutate()}
                />

                <MessageComposer
                  onSend={(body, mentions, attachment) => sendMessageMutation.mutate({ body, mentions, attachment })}
                  disabled={sendMessageMutation.isPending}
                  conversation={selectedConv}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                <AppIcon name="chat" className=" text-neutral-300 mb-2" />
                <p className="text-xs font-medium">Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <QuickNotes />
        </div>
      </div>

      <CreateGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSuccess={(convId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
          if (convId) setSelectedId(convId);
        }}
      />
    </div>
  );
}
