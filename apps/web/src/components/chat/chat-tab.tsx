"use client";

import { useState, useEffect, useMemo } from "react";
import { isChatPinned } from "@/lib/chat-utils";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch, unwrapList, isQueued } from "@/lib/api-client";
import { asArray } from "@/lib/utils";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Avatar, AvatarFallback, MeaningfulEmpty } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { CreateGroupDialog } from "@/components/chat/create-group-dialog";
import { queryKeys } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { toast } from "sonner";

interface ChatUser { id: number; name?: string; pivot?: { last_read_at?: string } }
interface ChatMessage { id: number; sender_id: number; created_at: string; reads?: {user_id: number}[]; conversation_id?: number; sender?: ChatUser; pending?: boolean; body?: string; }
interface ChatConversation { id: number | string; unread_count?: number; latestMessage?: ChatMessage; users?: ChatUser[]; scope?: string; name?: string; is_divider?: boolean; title?: string; }
interface PaginatedResponse<T> { next_cursor?: string; data: T[] }
interface InfiniteQueryData<T> { pages: PaginatedResponse<T>[] }

export function ChatTab() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { subscribe, leaveChannel, isConnected } = useReverb();
  const { data: caps = [] } = useCapabilities();
  const canManageChat = hasCapability(caps, "chat.manage");

  // Mirrors the backend gate: only users.manage (HR) or projects.manage (Admin)
  // may pin/unpin messages in project conversations.
  const canPinMessages = (conv: any) => canManageChat && conv?.scope === 'project';

  const initialConvId = searchParams.get("conversation");
  const [selectedId, setSelectedId] = useState<number | string | null>(initialConvId ? parseInt(initialConvId) : null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<"all" | "direct" | "group" | "project">("all");
  
  // Track which message we are replying to
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const [prevInitialConvId, setPrevInitialConvId] = useState(initialConvId);
  if (initialConvId !== prevInitialConvId) {
    setPrevInitialConvId(initialConvId);
    if (initialConvId) {
      setSelectedId(parseInt(initialConvId));
      setReplyingTo(null);
    }
  }

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
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        if (selectedId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.messages(Number(selectedId)) });
        }
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    return () => window.removeEventListener("visibilitychange", handleVisibility);
  }, [selectedId, queryClient]);

  // Global user listener for incoming messages to show toasts and update the list
  useEffect(() => {
    if (!user?.id) return;
    
    const userChannelName = `user.${user.id}`;
    const channel = subscribe(userChannelName, true);
    if (channel) {
      const handler = (e: { message: ChatMessage }) => {
        if (e.message.sender_id !== user.id) {
          // Play a sound if you have one, or just show toast
          if (selectedId !== e.message.conversation_id) {
            toast(`New message from ${e.message.sender?.name || 'Someone'}`, {
              icon: '💬',
            });
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        }
      };
      
      channel.listen(".message-sent", handler);
      
      const deleteHandler = (e: { message_id: number, conversation_id: number }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      };
      
      channel.listen(".message-deleted", deleteHandler);
      
      return () => {
        channel.stopListening(".message-sent");
        channel.stopListening(".message-deleted");
        leaveChannel(userChannelName);
      };
    }
  }, [user?.id, subscribe, leaveChannel, queryClient, selectedId]);

  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchUsersData } = useQuery<any[]>({
    queryKey: queryKeys.chatUsers(searchQuery),
    queryFn: () => apiFetch(`/chat/users?search=${encodeURIComponent(searchQuery)}`).then(unwrapList),
    enabled: searchQuery.length > 2,
  });

  const startDirectMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      return apiFetch("/conversations/dm", {
        method: "POST",
        body: JSON.stringify({ recipient_id: recipientId }),
      });
    },
    onSuccess: (data) => {
      if (isQueued(data)) {
        setSearchQuery("");
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      const convId = data?.id || data?.conversation_id || (data?.data && (data.data.id || data.data.conversation_id));
      if (convId) {
        setSelectedId(convId);
      }
      setSearchQuery("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to start direct message");
    }
  });

  const handleSelectConversation = (id: number | string) => {
    if (typeof id === 'string' && id.startsWith('user-')) {
      const userId = parseInt(id.replace('user-', ''));
      startDirectMutation.mutate(userId);
    } else {
      setSelectedId(id as number);
    }
  };

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
    getNextPageParam: (lastPage: PaginatedResponse<ChatConversation>) => lastPage.next_cursor || null,
    initialPageParam: null as string | null,
    refetchInterval: isConnected ? false : 15_000,
  });

  const allConversations = rawConversationsData?.pages?.flatMap((page: PaginatedResponse<ChatConversation>) => (Array.isArray(page?.data) ? page.data : (Array.isArray(page) ? page : []))) || [];
  
  const conversationUserIds = new Set(
    allConversations
      .filter((c) => c.scope === "direct")
      .flatMap((c) => c.users?.map((u: ChatUser) => u.id) || [])
  );
  
  const searchUsersArray = searchUsersData || [];
  const searchUsers: ChatConversation[] = searchUsersArray
    .filter((u: any) => !conversationUserIds.has(u.id) && u.id !== user?.id)
    .map((u: any) => ({
      id: `user-${u.id}` as any,
      is_user: true,
      name: u.name,
      scope: "direct",
      latestMessage: { id: 0, conversation_id: 0, sender_id: 0, body: "Click to start chatting", created_at: new Date().toISOString() },
      users: [u],
      original_user_id: u.id,
    }));

  const allItems = [...allConversations, ...searchUsers];

  // Sort conversations: pinned first, then unread first, then by latest message date
  const sortedItems = [...allItems].sort((a: ChatConversation, b: ChatConversation) => {
    const aCurrentUserData = a.users?.find((u: ChatUser) => u.id === user?.id);
    const aLastReadAt = aCurrentUserData?.pivot?.last_read_at;
    const aIsPinned = isChatPinned(a, user?.id);
    const aIsUnread = (a.unread_count && a.unread_count > 0) || (a.latestMessage &&
      a.latestMessage.sender_id !== 0 && a.latestMessage.sender_id !== user?.id &&
      (!aLastReadAt || new Date(a.latestMessage.created_at) > new Date(aLastReadAt)));

    const bCurrentUserData = b.users?.find((u: ChatUser) => u.id === user?.id);
    const bLastReadAt = bCurrentUserData?.pivot?.last_read_at;
    const bIsPinned = isChatPinned(b, user?.id);
    const bIsUnread = (b.unread_count && b.unread_count > 0) || (b.latestMessage &&
      b.latestMessage.sender_id !== 0 && b.latestMessage.sender_id !== user?.id &&
      (!bLastReadAt || new Date(b.latestMessage.created_at) > new Date(bLastReadAt)));

    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;

    if (aIsUnread && !bIsUnread) return -1;
    if (!aIsUnread && bIsUnread) return 1;

    const aTime = a.latestMessage ? new Date(a.latestMessage.created_at).getTime() : 0;
    const bTime = b.latestMessage ? new Date(b.latestMessage.created_at).getTime() : 0;
    return bTime - aTime;
  });

  const pinnedCount = sortedItems.filter(c => {
    return isChatPinned(c, user?.id);
  }).length;

  // Compute total unread count across all conversations
  const totalUnreadCount = useMemo(() => {
    return allConversations.reduce((count: number, c: ChatConversation) => {
      const uc = c.unread_count || 0;
      if (uc > 0) return count + uc;
      // Fallback: check latestMessage vs last_read_at
      const uData = c.users?.find((u: ChatUser) => u.id === user?.id);
      const lastRead = uData?.pivot?.last_read_at;
      if (c.latestMessage && c.latestMessage.sender_id !== user?.id &&
        (!lastRead || new Date(c.latestMessage.created_at) > new Date(lastRead))) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [allConversations, user?.id]);

  // Apply scope filter
  const scopeFilteredItems = scopeFilter === "all"
    ? sortedItems
    : sortedItems.filter((c: ChatConversation) => c.scope === scopeFilter);

  const conversations: ChatConversation[] = [];
  if (pinnedCount > 0 && !searchQuery && scopeFilter === "all") {
    const pinnedItems = scopeFilteredItems.filter(c => {
      return isChatPinned(c, user?.id);
    });
    const unpinnedItems = scopeFilteredItems.filter(c => {
      return !isChatPinned(c, user?.id);
    });
    if (pinnedItems.length > 0) {
      conversations.push({ id: 'divider-pinned', is_divider: true, title: 'Pinned' });
      conversations.push(...pinnedItems);
    }
    if (unpinnedItems.length > 0) {
      conversations.push({ id: 'divider-recent', is_divider: true, title: 'Recent' });
      conversations.push(...unpinnedItems);
    }
  } else {
    conversations.push(...scopeFilteredItems);
  }

  const { 
    data: messageData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: queryKeys.messages(selectedId as number),
    queryFn: ({ pageParam }) => apiFetch(`/conversations/${selectedId}/messages${pageParam ? `?cursor=${pageParam}` : ''}`),
    getNextPageParam: (lastPage: PaginatedResponse<ChatMessage>) => lastPage.next_cursor || null,
    initialPageParam: null as string | null,
    enabled: !!selectedId,
    refetchInterval: isConnected ? false : 15_000,
  });

  useEffect(() => {
    if (!selectedId) return;

    const channelName = `conversation.${selectedId}`;
    const channel = subscribe(channelName, true);
    if (channel) {
      const handler = (e: { message: ChatMessage }) => {
        queryClient.setQueryData(queryKeys.messages(selectedId as number), (old: InfiniteQueryData<ChatMessage> | undefined) => {
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

      const readHandler = (e: { userId: number }) => {
        // Optimistically update cache to mark messages as read
        if (e.userId) {
          queryClient.setQueryData(queryKeys.messages(selectedId as number), (old: InfiniteQueryData<ChatMessage> | undefined) => {
            if (!old?.pages) return old;
            
            return {
              ...old,
              pages: old.pages.map((page: PaginatedResponse<ChatMessage>) => ({
                ...page,
                data: page.data.map((msg: ChatMessage) => {
                  // Mark as read if the message was sent by someone other than the reader
                  if (msg.sender_id !== e.userId) {
                    const currentReads = msg.reads || [];
                    if (!currentReads.find((r: { user_id: number }) => r.user_id === e.userId)) {
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

      const deleteHandler = (e: { message_id: number, conversation_id: number }) => {
        queryClient.setQueryData(queryKeys.messages(selectedId as number), (old: InfiniteQueryData<ChatMessage> | undefined) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: PaginatedResponse<ChatMessage>) => ({
              ...page,
              data: page.data.filter((msg: ChatMessage) => msg.id !== e.message_id)
            }))
          };
        });
      };

      channel.listen(".message-deleted", deleteHandler);

      return () => {
        channel.stopListening(".message-sent");
        channel.stopListening(".message-read");
        channel.stopListening(".message-deleted");
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

  const selectedConv = conversations.find((c: ChatConversation) => c.id === selectedId);
  const pages = messageData?.pages;
  const messages = pages ? pages.flatMap((page: PaginatedResponse<ChatMessage>) => asArray<ChatMessage>(page?.data)).reverse() : [];
  const unreadCount = selectedConv?.unread_count || 0;

  useEffect(() => {
    if (selectedId && unreadCount > 0 && !markReadMutation.isPending) {
      markReadMutation.mutate();
    }
  }, [selectedId, messages, user?.id, markReadMutation]);

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

  const pinChatMutation = useMutation({
    mutationFn: async () => apiFetch(`/conversations/${selectedId}/pin`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      toast.success("Chat pinned successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to pin chat"),
  });

  const unpinChatMutation = useMutation({
    mutationFn: async () => apiFetch(`/conversations/${selectedId}/unpin`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      toast.success("Chat unpinned successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to unpin chat"),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ body, mentions, attachment, replyToId }: { body: string; mentions?: number[]; attachment?: File | null; replyToId?: number }) => {
      if (attachment) {
        const formData = new FormData();
        formData.append("body", body);
        if (mentions?.length) {
          mentions.forEach(m => formData.append("mentions[]", m.toString()));
        }
        if (replyToId) {
          formData.append("reply_to_id", replyToId.toString());
        }
        formData.append("attachment", attachment);
        
        return apiFetch(`/conversations/${selectedId}/messages`, {
          method: "POST",
          body: formData,
        });
      } else {
        return apiFetch(`/conversations/${selectedId}/messages`, {
          method: "POST",
          body: JSON.stringify({ body, mentions, reply_to_id: replyToId }),
        });
      }
    },
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(selectedId as number) });
      const previousMessages = queryClient.getQueryData(queryKeys.messages(selectedId as number));
      
      const optimisticMessage: ChatMessage = {
        id: Date.now(),
        conversation_id: selectedId as number,
        sender_id: user?.id as number,
        body: newMsg.body,
        created_at: new Date().toISOString(),
        sender: user || undefined,
        pending: true
      };

      queryClient.setQueryData(queryKeys.messages(selectedId as number), (old: InfiniteQueryData<ChatMessage> | undefined) => {
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
    onSettled: (data) => {
      import("@/lib/api-client").then(({ isQueued }) => {
        if (!isQueued(data)) {
          queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
          queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        }
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (msgId: number) => {
      return apiFetch(`/conversations/${selectedId}/messages/${msgId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      toast.success("Message deleted");
    }
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/conversations/${selectedId}/clear`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      toast.success("Chat cleared");
    }
  });

  // Derive chat header subtitle
  const chatHeaderName = selectedConv?.scope === 'direct'
    ? selectedConv?.users?.find((p: ChatUser) => p.id !== user?.id)?.name
    : selectedConv?.name;
  const chatHeaderSubtitle = selectedConv?.scope === 'direct'
    ? 'Direct Message'
    : selectedConv?.scope === 'global'
      ? 'Everyone'
      : selectedConv?.users
        ? `${selectedConv.users.length} member${selectedConv.users.length !== 1 ? 's' : ''}`
        : undefined;

  const scopeFilters = [
    { key: 'all' as const, label: 'All' },
    { key: 'direct' as const, label: 'Direct' },
    { key: 'group' as const, label: 'Groups' },
    { key: 'project' as const, label: 'Channels' },
  ];

  return (
    <>
      <div className="mt-4 flex flex-col h-[calc(100dvh-180px)] min-h-[500px] max-md:fixed max-md:inset-0 max-md:mt-0 max-md:z-[100] max-md:bg-background max-md:h-[100dvh] max-md:rounded-none">
      {/* Main Chat Interface */}
      <div
        className="flex-1 bg-card dark:bg-neutral-900 md:rounded-xl md:border md:border-neutral-200 dark:md:border-neutral-800 flex overflow-hidden"
        style={keyboardHeight > 0 ? { height: `calc(100dvh - ${window.innerWidth < 768 ? '0px' : '200px'} - ${keyboardHeight}px)`, minHeight: 0 } : undefined}
      >
        {/* Conversation sidebar */}
        <div className={`w-full md:w-72 lg:w-80 shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          {/* Sidebar header */}
          <div className="p-2.5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">Chats</span>
                {totalUnreadCount > 0 && (
                  <span className="flex items-center justify-center bg-primary-600 text-white font-bold text-[9px] h-4 min-w-[16px] px-1.5 rounded-full shadow-sm">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </div>
              {canManageChat && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 shrink-0"
                  aria-label="New group chat"
                  title="New Group"
                  onClick={() => setGroupDialogOpen(true)}
                >
                  <AppIcon name="plus" size="sm" />
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative px-0.5">
              <AppIcon name="search" size="xs" className="absolute left-2 top-2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 pl-7 pr-3 text-[11px] bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-primary-500 rounded-md outline-none transition-colors"
              />
            </div>

            {/* Scope filter pills */}
            <div className="flex items-center gap-1 px-0.5">
              {scopeFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setScopeFilter(f.key)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                    scopeFilter === f.key
                      ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto thin-scrollbar">
            <ConversationList
              currentUserId={user?.id as number}
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelectConversation}
              hasNextPage={hasNextConversations}
              isFetchingNextPage={isFetchingNextConversations}
              fetchNextPage={fetchNextConversations}
            />
          </div>
        </div>

        {/* Active Chat Area */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-neutral-950 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
          {selectedId ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-card dark:bg-neutral-900 flex items-center gap-3">
                <Button variant="ghost" size="sm" className="md:hidden p-0 h-11 w-11 sm:h-8 sm:w-8" onClick={() => setSelectedId(null)}>
                  <AppIcon name="arrowLeft" />
                </Button>

                {/* Avatar for the chat partner / group */}
                {selectedConv?.scope === 'direct' ? (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback name={chatHeaderName || 'U'} className="text-[10px]" />
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center shrink-0">
                    <AppIcon name={selectedConv?.scope === 'global' ? 'globe' : selectedConv?.scope === 'project' ? 'hash' : 'directory'} className="text-primary-600 dark:text-primary-400" size="sm" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                    {chatHeaderName}
                  </h3>
                  {chatHeaderSubtitle && (
                    <p className="text-[10px] text-neutral-500 truncate">{chatHeaderSubtitle}</p>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  {!isConnected && (
                    <span
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 text-[10px] font-semibold shrink-0"
                      title="Real-time connection lost — falling back to periodic refresh"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Offline
                    </span>
                  )}
                  {selectedConv?.scope !== 'global' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-600">
                          <AppIcon name="more" size="sm" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          const isPinned = isChatPinned(selectedConv, user?.id);
                          if (isPinned) {
                            unpinChatMutation.mutate();
                          } else {
                            if (pinnedCount >= 100) {
                              toast.error("You can only pin up to 100 conversations.");
                              return;
                            }
                            pinChatMutation.mutate();
                          }
                        }} disabled={pinChatMutation.isPending || unpinChatMutation.isPending}>
                          <AppIcon name="pin" className="mr-2" />
                          {isChatPinned(selectedConv, user?.id) ? "Unpin chat" : "Pin chat"}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => {
                          if (window.confirm("Are you sure you want to clear this chat? This will only remove the messages for you.")) {
                            clearChatMutation.mutate();
                          }
                        }} disabled={clearChatMutation.isPending} className="text-red-500 hover:text-red-600 focus:text-red-600">
                          <AppIcon name="trash" className="mr-2" /> Clear Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8 text-neutral-400 hover:text-neutral-600" onClick={() => setSelectedId(null)} title="Close Chat">
                    <AppIcon name="close" size="sm" />
                  </Button>
                </div>
              </div>

              <MessageList 
                messages={messages} 
                currentUserId={user?.id || 0} 
                onFetchNextPage={() => fetchNextPage()}
                hasNextPage={!!hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onPinMessage={(msgId) => pinMutation.mutate(msgId)}
                onUnpinMessage={(msgId) => unpinMutation.mutate(msgId)}
                canManage={canPinMessages(selectedConv)}
                onMarkRead={() => markReadMutation.mutate()}
                onDeleteMessage={(msgId) => deleteMessageMutation.mutate(msgId)}
                onReply={(msg) => setReplyingTo(msg as ChatMessage)}
                conversationType={selectedConv?.scope}
              />

              <MessageComposer
                onSend={(body, mentions, attachment) => {
                  sendMessageMutation.mutate({ body, mentions, attachment, replyToId: replyingTo?.id });
                  setReplyingTo(null);
                }}
                disabled={sendMessageMutation.isPending}
                conversation={selectedConv}
                replyTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <MeaningfulEmpty
                entityName="conversations"
                icon="chat"
                description="Select a conversation from the sidebar, or start a new chat."
                actionLabel={canManageChat ? "New Group" : undefined}
                onAction={canManageChat ? () => setGroupDialogOpen(true) : undefined}
              />
            </div>
          )}
        </div>
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
    </>
  );
}
