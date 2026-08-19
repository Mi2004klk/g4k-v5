"use client";

import { useRef, useCallback, useEffect } from "react";
import { AppIcon } from "@g4k/ui/components";
import { format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";

interface ChatUser { id: number; name?: string; pivot?: { last_read_at?: string } }
interface ChatMessage { id: number; sender_id: number; created_at: string; body?: string }
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
    estimateSize: useCallback(() => 64, []),
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
        return <AppIcon name="globe" className=" text-primary-500" />;
      case "project":
        return <AppIcon name="hash" className=" text-blue-500" />;
      case "group":
        return <AppIcon name="directory" className=" text-amber-500" />;
      default:
        return <AppIcon name="chat" className=" text-emerald-500" />;
    }
  };

  return (
    <div ref={parentRef} className="h-full overflow-y-auto relative">
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

          const title = conv.name || (conv.scope === "direct" ? conv.users?.find((u: ChatUser) => u.id !== currentUserId)?.name || "Direct Message" : "Chat");

          return (
            <div
              key={conv.id || virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              onClick={() => onSelect(conv.id)}
              className={`absolute top-0 left-0 w-full p-3 flex items-start gap-3 cursor-pointer transition-all ${
                isSelected
                  ? "bg-primary-50/60 dark:bg-primary-950/40 border-l-2 border-primary-600"
                  : isUnread 
                    ? "bg-primary-50/30 dark:bg-primary-900/20 border-l-2 border-transparent hover:bg-primary-50/50" 
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border-l-2 border-transparent"
              }`}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="p-2 rounded-[var(--radius)] bg-neutral-100 dark:bg-neutral-800 shrink-0 mt-0.5">
                {getIcon(conv.scope)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs truncate ${isUnread ? "font-black text-primary-700 dark:text-primary-400" : "font-bold text-neutral-900 dark:text-white"}`}>
                    {title}
                  </h4>
                  {conv.latestMessage && (
                    <div className="flex items-center gap-1.5">
                      {isUnread && (
                        <span className="flex items-center justify-center bg-primary-600 text-white font-bold text-[9px] h-4 min-w-[1rem] px-1 rounded-full shadow-sm">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      <span className={`text-[10px] ${isUnread ? "text-primary-600 font-bold" : "text-neutral-400"}`}>
                        {format(new Date(conv.latestMessage.created_at), "h:mm a")}
                      </span>
                    </div>
                  )}
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${isUnread ? "font-semibold text-neutral-800 dark:text-neutral-200" : "text-neutral-500"}`}>
                  {conv.latestMessage ? conv.latestMessage.body : "No messages yet"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
