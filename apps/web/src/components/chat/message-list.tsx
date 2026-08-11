"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import { format } from "date-fns";
import { Paperclip } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

const MessageItem = memo(function MessageItem({
  msg,
  isMe,
}: {
  msg: any;
  isMe: boolean;
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
        className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 ${
          isMe
            ? "bg-violet-600 text-white rounded-tr-none"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-none"
        }`}
      >
        {msg.replyTo && (
          <div className={`p-1.5 rounded text-[10px] mb-1 opacity-80 ${isMe ? "bg-violet-700" : "bg-neutral-200 dark:bg-neutral-700"}`}>
            <span className="font-bold block">{msg.replyTo.sender?.name}</span>
            <span className="truncate block">{msg.replyTo.body}</span>
          </div>
        )}

        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>

        {msg.attachment_url && (
          <a
            href={msg.attachment_url}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-1.5 mt-1 underline text-[10px] ${isMe ? "text-violet-200" : "text-violet-600"}`}
          >
            <Paperclip className="w-3 h-3" /> Attachment
          </a>
        )}
      </div>
    </div>
  );
});

export function MessageList({
  messages,
  currentUserId,
  onFetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: {
  messages: any[];
  currentUserId: number;
  onFetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
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

  return (
    <div 
      ref={scrollRef} 
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3 relative"
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
          const isMe = msg.sender_id === currentUserId;

          return (
            <div
              key={msg.id || virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageItem msg={msg} isMe={isMe} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
