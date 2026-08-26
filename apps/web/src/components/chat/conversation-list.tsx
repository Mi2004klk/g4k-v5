"use client";

import { useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage, AppIcon, EmptyState, Button } from "@g4k/ui/components";
import { SwipeToReveal } from "./swipe-to-reveal";
import { useVirtualizer } from "@tanstack/react-virtual";
import { isChatPinned } from "@/lib/chat-utils";

export interface ChatUser { id: number; name?: string; pivot?: { last_read_at?: string, is_pinned?: boolean | number } }
export interface ChatMessage { id: number; sender_id: number; created_at: string; body?: string }
export interface ChatConversation {
  id: number | string;
  unread_count?: number;
  latestMessage?: ChatMessage;
  users?: ChatUser[];
  name?: string;
  scope?: string;
  is_pinned?: boolean;
  is_divider?: boolean;
  title?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  conversations: ChatConversation[];
  selectedId: number | string | null;
  currentUserId: number;
  onSelect: (id: number | string) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-compiler/react-compiler
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? conversations.length + 1 : conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 54, []),
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!virtualItems.length) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    
    if (
      lastItem.index >= conversations.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage?.();
    }
  }, [virtualItems, conversations.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getIcon = (scope?: string) => {
    switch (scope) {
      case "global":
        return <div className="h-8 w-8 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center shrink-0"><AppIcon name="globe" className="text-primary-500" size="sm" /></div>;
      case "project":
        return <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0"><AppIcon name="hash" className="text-blue-500" size="sm" /></div>;
      case "group":
        return <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0"><AppIcon name="directory" className="text-amber-500" size="sm" /></div>;
      default:
        return <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0"><AppIcon name="chat" className="text-emerald-500" size="sm" /></div>;
    }
  };

  return (
    <div ref={parentRef} className="h-full overflow-y-auto relative">
      {conversations.length === 0 && !isFetchingNextPage ? (
        <EmptyState
          title="No Conversations"
          description="You don't have any chats yet."
          icon={<AppIcon name="chat" size="2xl" />}
          action={
            <Button size="sm" className="gap-2 rounded-full font-semibold shadow-sm px-6" onClick={() => document.dispatchEvent(new CustomEvent("open-new-chat-dialog"))}>
              <AppIcon name="plus" size="sm" /> Start New Chat
            </Button>
          }
          className="mt-10"
        />
      ) : (
      <div
        className="w-full relative divide-y divide-neutral-100 dark:divide-neutral-800"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualRow) => {
          const isLoaderRow = virtualRow.index > conversations.length - 1;
          const conv = conversations[virtualRow.index];
          
          if (isLoaderRow) {
            return (
              <div
                key="loader"
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full p-3 flex items-center justify-center text-xs text-neutral-400"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                Loading older chats...
              </div>
            );
          }

          if (!conv) return null;
          
          if (conv.is_divider) {
            return (
              <div
                key={conv.id || virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full px-3 py-1.5 bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{conv.title}</span>
              </div>
            );
          }
          
          const isSelected = selectedId === conv.id;

          const currentUserData = conv.users?.find((u: ChatUser) => u.id === currentUserId);
          const lastReadAt = currentUserData?.pivot?.last_read_at;

          const isUnread = (conv.unread_count && conv.unread_count > 0) || (conv.latestMessage &&
            conv.latestMessage.sender_id !== currentUserId &&
            (!lastReadAt || new Date(conv.latestMessage.created_at) > new Date(lastReadAt)));
          
          const unreadCount = conv.unread_count || (isUnread ? 1 : 0);
          const isPinned = isChatPinned(conv as any, currentUserId);

          const title = conv.name || (conv.scope === "direct" ? conv.users?.find((u: ChatUser) => u.id !== currentUserId)?.name || "Direct Message" : "Chat");

          return (
          return (
            <div
              key={conv.id || virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <SwipeToReveal
                actionWidth={140}
                actions={
                  <div className="flex items-center h-full">
                    <button className="h-full px-4 bg-primary-500 text-white flex flex-col items-center justify-center gap-1 active:bg-primary-600 transition-colors">
                      <AppIcon name={isPinned ? "close" : "pin"} size="sm" />
                      <span className="text-[10px] font-semibold">{isPinned ? "Unpin" : "Pin"}</span>
                    </button>
                    <button className="h-full px-4 bg-neutral-500 text-white flex flex-col items-center justify-center gap-1 active:bg-neutral-600 transition-colors">
                      <AppIcon name="archive" size="sm" />
                      <span className="text-[10px] font-semibold">Archive</span>
                    </button>
                  </div>
                }
              >
                <div
                  onClick={() => onSelect(conv.id)}
                  className={`w-full px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary-50/60 dark:bg-primary-950/30 border-l-2 border-l-primary-600"
                      : isUnread 
                        ? "bg-neutral-50/50 dark:bg-neutral-900/30 border-l-2 border-l-primary-400 dark:border-l-primary-600 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40" 
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border-l-2 border-l-transparent"
                  }`}
                >
                  {/* Avatar: initials for DMs, icon for channels */}
                  {conv.scope === 'direct' ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback name={title} className="text-[10px]" />
                    </Avatar>
                  ) : (
                    getIcon(conv.scope)
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className={`text-xs truncate ${isUnread ? "font-bold text-neutral-900 dark:text-white" : "font-semibold text-neutral-700 dark:text-neutral-300"}`}>
                          {title}
                        </h4>
                        {isPinned && <AppIcon name="pin" size="xs" className="text-primary-500 shrink-0" />}
                      </div>
                      {conv.latestMessage && (
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          {isUnread && (
                            <span className="flex items-center justify-center bg-primary-600 text-white font-bold text-[9px] h-4 min-w-[16px] px-1 rounded-full shadow-sm shadow-primary-500/30">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                          <span className={`text-[9px] tabular-nums ${isUnread ? "text-primary-600 dark:text-primary-400 font-bold" : "text-neutral-400 font-medium"}`}>
                            {format(new Date(conv.latestMessage.created_at), "h:mm a")}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isUnread ? "font-medium text-neutral-700 dark:text-neutral-300" : "text-neutral-500"}`}>
                      {conv.latestMessage ? conv.latestMessage.body : "No messages yet"}
                    </p>
                  </div>
                </div>
              </SwipeToReveal>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
