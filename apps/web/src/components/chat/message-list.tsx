"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import { format } from "date-fns";
import { AppIcon, IconName } from "@g4k/ui/components";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button } from "@g4k/ui/components";

const MessageItem = memo(function MessageItem({
  msg,
  isMe,
  onPinMessage,
  onUnpinMessage,
  canManage,
}: {
  msg: any;
  isMe: boolean;
  onPinMessage?: (msgId: number) => void;
  onUnpinMessage?: (msgId: number) => void;
  canManage?: boolean;
}) {
  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-400">
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
          {isMe ? "You" : msg.sender?.name}
        </span>
        <span>•</span>
        <span>{format(new Date(msg.created_at), "h:mm a")}</span>
      </div>

      <div
        className={`max-w-[75%] p-3 rounded-xl text-xs space-y-1 ${
          isMe
            ? "bg-primary-600 text-white rounded-tr-none"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-none"
        }`}
      >
        {msg.replyTo && (
          <div className={`p-1.5 rounded text-[10px] mb-1 opacity-80 ${isMe ? "bg-primary-700" : "bg-neutral-200 dark:bg-neutral-700"}`}>
            <span className="font-bold block">{msg.replyTo.sender?.name}</span>
            <span className="truncate block">{msg.replyTo.body}</span>
          </div>
        )}

        <p className="leading-relaxed whitespace-pre-wrap">
          {msg.body?.split(/(@[a-zA-Z0-9_-]+)/g).map((part: string, i: number) => 
            part.startsWith('@') ? (
              <span key={i} className="text-amber-500 font-semibold">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>

        {msg.attachment_url && (
          <div className="mt-2">
            {/\.(jpe?g|png|gif|webp)$/i.test(msg.attachment_url) ? (
              <a href={msg.attachment_url} target="_blank" rel="noreferrer">
                <img 
                  src={msg.attachment_url} 
                  alt="Attachment" 
                  className="max-w-full max-h-48 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity border border-neutral-200 dark:border-neutral-700"
                />
              </a>
            ) : (
              <a
                href={msg.attachment_url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 underline text-[10px] ${isMe ? "text-primary-200" : "text-primary-600"}`}
              >
                <AppIcon name="paperclip" size="xs" /> Attachment
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-0.5">
        <div className="flex gap-1">
          {msg.pinned_at && (
            <span className="text-[10px] text-amber-500 flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">
              <AppIcon name="pin" size="xs" /> Pinned
            </span>
          )}
        </div>
        
        {isMe && (
          <div className="text-[10px] text-neutral-400 mr-1 flex items-center justify-end gap-1">
            {msg.reads && msg.reads.length > 0 ? (
              <AppIcon name="read" size="xs" className=" text-primary-500" />
            ) : (
              <AppIcon name="check" size="xs" />
            )}
          </div>
        )}
      </div>

      {canManage && (
        <div className={`absolute top-2 ${isMe ? "right-full mr-2" : "left-full ml-2"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                <AppIcon name="moreH" size="xs" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMe ? "end" : "start"}>
              {msg.pinned_at ? (
                <DropdownMenuItem onClick={() => onUnpinMessage?.(msg.id)}>
                  <AppIcon name="pin" className=" mr-2 text-neutral-400" /> Unpin Message
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPinMessage?.(msg.id)}>
                  <AppIcon name="pin" className=" mr-2 text-amber-500" /> Pin Message
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
});

export function MessageList({
  messages,
  currentUserId,
  onFetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onPinMessage,
  onUnpinMessage,
  canManage,
}: {
  messages: any[];
  currentUserId: number;
  onFetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onPinMessage?: (msgId: number) => void;
  onUnpinMessage?: (msgId: number) => void;
  canManage?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback(() => 72, []),
    overscan: 5,
  });

  useEffect(() => {
    if (scrollRef.current && !isFetchingNextPage) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isFetchingNextPage]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasNextPage && !isFetchingNextPage && onFetchNextPage) {
      onFetchNextPage();
    }
  };

  const pinnedMessages = messages.filter(m => m.pinned_at);

  return (
    <div className="flex flex-col h-full w-full relative">
      {pinnedMessages.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-amber-50/95 dark:bg-amber-950/95 border-b border-amber-200 dark:border-amber-900 p-2 text-xs flex flex-col gap-2 shadow-sm backdrop-blur">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold mb-1">
            <AppIcon name="pin" size="sm" /> Pinned Messages ({pinnedMessages.length})
          </div>
          <div className="flex gap-2 overflow-x-auto thin-scrollbar pb-1">
            {pinnedMessages.map(pm => (
              <div key={pm.id} className="min-w-[200px] max-w-[250px] shrink-0 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 rounded p-2">
                <span className="font-semibold block text-[10px] text-amber-600 dark:text-amber-500 mb-0.5">{pm.sender?.name}</span>
                <span className="truncate block">{pm.body}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto p-4 space-y-3 relative ${pinnedMessages.length > 0 ? "pt-24" : ""}`}
      >
        {isFetchingNextPage && (
          <div className="text-center text-xs text-neutral-400 py-1">Loading older messages...</div>
        )}
      <div
        className="w-full relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const msg = messages[virtualRow.index];
          if (!msg) return null;
          
          const isMe = msg.sender_id === currentUserId;

          return (
            <div
              key={msg.id || virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full group"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageItem 
                msg={msg} 
                isMe={isMe} 
                onPinMessage={onPinMessage} 
                onUnpinMessage={onUnpinMessage}
                canManage={canManage}
              />
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
