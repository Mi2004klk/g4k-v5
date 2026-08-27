"use client";

import { useEffect, useRef, memo, useCallback, useState } from "react";
import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { Avatar, AvatarFallback } from "@g4k/ui/components";
import { useVirtualizer } from "@tanstack/react-virtual";
import Image from "next/image";

interface ListMessage {
  id: number;
  sender_id: number;
  created_at: string;
  body?: string;
  attachment_url?: string;
  is_pinned?: boolean;
  pending?: boolean;
  sender?: { name?: string };
  reads?: { user_id: number }[];
}
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button, Dialog, DialogContent, DialogTrigger } from "@g4k/ui/components";

const MessageItem = memo(function MessageItem({
  msg,
  isMe,
  isConsecutive = false,
  onPinMessage,
  onUnpinMessage,
  canManage,
  onMarkRead,
  onDeleteMessage,
  onReply,
  conversationType,
}: {
  msg: ListMessage;
  isMe: boolean;
  isConsecutive?: boolean;
  onPinMessage?: (msgId: number) => void;
  onUnpinMessage?: (msgId: number) => void;
  canManage?: boolean;
  onMarkRead?: () => void;
  onDeleteMessage?: (msgId: number) => void;
  onReply?: (msg: ListMessage) => void;
  conversationType?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [hasMarkedRead, setHasMarkedRead] = useState(false);

  useEffect(() => {
    if (isMe || !onMarkRead || hasMarkedRead) return;
    
    // Only trigger if this is an unread direct message
    const hasRead = msg.reads && msg.reads.length > 0;
    if (hasRead) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasMarkedRead(true);
        onMarkRead();
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isMe, onMarkRead, msg.reads]);

  return (
    <div ref={ref} className={`relative group flex ${isMe ? "flex-row-reverse" : "flex-row"} gap-2 ${isConsecutive ? "mt-0.5" : "mt-4"}`}>
      {/* Avatar column */}
      {!isConsecutive ? (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback name={isMe ? "You" : msg.sender?.name || 'U'} className="text-[9px]" />
        </Avatar>
      ) : (
        <div className="w-7 shrink-0" />
      )}

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} flex-1 min-w-0`}>
        {!isConsecutive && (
          <div className="flex items-center gap-1.5 mb-1 text-[9px] text-neutral-400 font-medium">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {isMe ? "You" : msg.sender?.name}
            </span>
            <span>•</span>
            <span className="tabular-nums">{format(new Date(msg.created_at), "h:mm a")}</span>
          </div>
        )}

      <div
        className={`max-w-[85%] px-3 py-2 rounded-lg text-[11px] space-y-1 shadow-sm ${
          isMe
            ? "bg-primary-600 text-white rounded-tr-none"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-none"
        }`}
      >
        {(msg as any).replyTo && (
          <div className={`p-1.5 rounded text-[10px] mb-1 opacity-80 ${isMe ? "bg-primary-700" : "bg-neutral-200 dark:bg-neutral-700"}`}>
            <span className="font-bold block">{(msg as any).replyTo.sender?.name}</span>
            <span className="truncate block">{(msg as any).replyTo.body}</span>
          </div>
        )}

        <p className="leading-relaxed whitespace-pre-wrap">
          {msg.body?.split(/(@[a-zA-Z0-9_ -]+?\b)/g).map((part: string, i: number) => 
            part.startsWith('@') ? (
              <span key={i} className="text-amber-500 font-semibold">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>

        {msg.attachment_url && (
          <div className="mt-2">
            {/\.(jpe?g|png|gif|webp|pdf)$/i.test(msg.attachment_url) ? (
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-left w-full max-w-full">
                    {/\.(pdf)$/i.test(msg.attachment_url) ? (
                      <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:opacity-80 transition-opacity">
                        <AppIcon name="fileText" className="w-8 h-8 text-rose-500" />
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-semibold truncate">View PDF Document</span>
                          <span className="text-[10px] text-neutral-500 uppercase">PDF File</span>
                        </div>
                      </div>
                    ) : (
                      <>
                      <div className="relative w-full h-48 max-w-sm rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:opacity-90 transition-opacity">
                        <Image
                          src={msg.attachment_url} 
                          alt="Attachment"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <div className="hidden flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:opacity-80 transition-opacity">
                          <AppIcon name="fileText" className="w-8 h-8 text-neutral-400" />
                          <div className="flex flex-col truncate text-left">
                            <span className="text-xs font-semibold truncate">Open Attachment</span>
                            <span className="text-[10px] text-neutral-500 uppercase">File</span>
                          </div>
                        </div>
                      </>
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 overflow-hidden flex flex-col bg-neutral-950 border-neutral-800">
                  <div className="flex-1 w-full h-full relative flex items-center justify-center p-4">
                    {/\.(pdf)$/i.test(msg.attachment_url) ? (
                      <iframe src={msg.attachment_url} className="w-full h-full rounded-md bg-white" />
                    ) : (
                      <>
                      <div className="relative w-full h-full">
                        <Image
                          src={msg.attachment_url} 
                          alt="Preview"
                          fill
                          unoptimized
                          className="object-contain rounded-md"
                        />
                      </div>
                      </>
                    )}
                    <div className="hidden text-white flex flex-col items-center gap-4">
                       <AppIcon name="fileText" className="w-16 h-16 text-neutral-500" />
                       <span>Preview not available</span>
                    </div>
                  </div>
                  <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-end gap-2">
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" download className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                      Download Original
                    </a>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <a
                href={msg.attachment_url}
                target="_blank"
                rel="noreferrer"
                download
                className={`flex items-center gap-1.5 underline text-[10px] ${isMe ? "text-primary-200" : "text-primary-600"}`}
              >
                <AppIcon name="paperclip" size="xs" /> Download File
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-0.5">
        <div className="flex gap-1">
          {(msg as any).pinned && (
            <span className="text-[10px] text-amber-500 flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">
              <AppIcon name="pin" size="xs" /> Pinned
            </span>
          )}
        </div>
        
        {isMe && conversationType === 'direct' && (
          <div className="text-[10px] text-neutral-400 mr-1 flex items-center justify-end gap-1">
            {msg.reads && msg.reads.length > 0 ? (
              <AppIcon name="read" size="xs" className=" text-primary-500" />
            ) : (
              <AppIcon name="check" size="xs" />
            )}
          </div>
        )}
      </div>

      <div className={`absolute top-2 ${isMe ? "right-full mr-2" : "left-full ml-2"} opacity-0 group-hover:opacity-100 transition-opacity`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
              <AppIcon name="moreH" size="xs" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isMe ? "end" : "start"}>
            <DropdownMenuItem onClick={() => onReply?.(msg)}>
              <AppIcon name="arrowLeft" className=" mr-2 text-primary-500" /> Reply
            </DropdownMenuItem>
            {canManage && ((msg as any).pinned ? (
                <DropdownMenuItem onClick={() => onUnpinMessage?.(msg.id)}>
                  <AppIcon name="pin" className=" mr-2 text-neutral-400" /> Unpin Message
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPinMessage?.(msg.id)}>
                  <AppIcon name="pin" className=" mr-2 text-amber-500" /> Pin Message
                </DropdownMenuItem>
              ))}
              {isMe && (
                <DropdownMenuItem onClick={() => {
                  if (window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
                    onDeleteMessage?.(msg.id);
                  }
                }} className="text-red-500 hover:text-red-600 focus:text-red-600">
                  <AppIcon name="trash" className="mr-2" /> Delete Message
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
  onPinMessage,
  onUnpinMessage,
  canManage,
  onMarkRead,
  onDeleteMessage,
  onReply,
  conversationType,
}: {
  messages: ListMessage[];
  currentUserId: number;
  onFetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onPinMessage?: (msgId: number) => void;
  onUnpinMessage?: (msgId: number) => void;
  canManage?: boolean;
  onMarkRead?: () => void;
  onDeleteMessage?: (msgId: number) => void;
  onReply?: (msg: ListMessage) => void;
  conversationType?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isScrolledToBottom = useRef<boolean>(true);

  // eslint-disable-next-line react-compiler/react-compiler
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback(() => 72, []),
    overscan: 5,
  });

  useEffect(() => {
    if (scrollRef.current) {
      if (isFetchingNextPage) {
        // We're loading older messages; save scroll height
        previousScrollHeight.current = scrollRef.current.scrollHeight;
      } else {
        requestAnimationFrame(() => {
          if (!scrollRef.current) return;
          const currentScrollHeight = scrollRef.current.scrollHeight;
          if (previousScrollHeight.current > 0 && currentScrollHeight > previousScrollHeight.current) {
            // Older messages just loaded, restore scroll position to avoid jump
            scrollRef.current.scrollTop += (currentScrollHeight - previousScrollHeight.current);
            previousScrollHeight.current = 0;
          } else if (isScrolledToBottom.current) {
            // New message came in and we were already at bottom, scroll to bottom
            scrollRef.current.scrollTop = currentScrollHeight;
          }
        });
      }
    }
  }, [messages.length, isFetchingNextPage]);

  const [showScrollFab, setShowScrollFab] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.clientHeight - target.scrollTop;
    isScrolledToBottom.current = distanceFromBottom < 10;
    setShowScrollFab(distanceFromBottom > 200);
    
    if (target.scrollTop === 0 && hasNextPage && !isFetchingNextPage && onFetchNextPage) {
      onFetchNextPage();
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const pinnedMessages = messages.filter(m => (m as any).pinned);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);

  return (
    <div className="flex flex-col h-full w-full relative">
      {pinnedMessages.length > 0 && (
        <div className="border-b border-amber-200 dark:border-amber-900 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur z-10">
          <button
            onClick={() => setPinnedExpanded(!pinnedExpanded)}
            className="w-full px-3 py-1.5 text-xs flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
              <AppIcon name="pin" size="sm" />
              <span>{pinnedMessages.length} Pinned</span>
            </div>
            {!pinnedExpanded && pinnedMessages.length > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-500 truncate max-w-[200px] ml-3">
                {pinnedMessages[pinnedMessages.length - 1]?.body}
              </span>
            )}
            <AppIcon name={pinnedExpanded ? 'chevronUp' : 'chevronDown'} size="xs" className="text-amber-500 shrink-0 ml-2" />
          </button>
          {pinnedExpanded && (
            <div className="px-3 pb-2 flex flex-col gap-1.5">
              {pinnedMessages.map(pm => (
                <div key={pm.id} className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 rounded px-2.5 py-1.5 flex items-center gap-2">
                  <span className="font-bold text-[9px] text-amber-600 dark:text-amber-500 shrink-0">{pm.sender?.name}:</span>
                  <span className="truncate text-[10px] text-neutral-700 dark:text-neutral-300">{pm.body}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 relative"
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
          
          const prevMsg = virtualRow.index > 0 ? messages[virtualRow.index - 1] : null;
          
          const msgDate = new Date(msg.created_at);
          const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
          
          const isNewDay = !prevDate || msgDate.toDateString() !== prevDate.toDateString();
          const isConsecutive = !isNewDay && prevMsg && prevMsg.sender_id === msg.sender_id && (msgDate.getTime() - prevDate.getTime() < 5 * 60 * 1000);

          const isMe = msg.sender_id === currentUserId;

          return (
            <div
              key={msg.id || virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full group flex flex-col"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isNewDay && (
                <div className="flex justify-center my-4">
                  <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] font-bold px-2 py-1 rounded-full">
                    {format(msgDate, "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              <MessageItem 
                msg={msg} 
                isMe={isMe} 
                isConsecutive={!!isConsecutive}
                onPinMessage={onPinMessage} 
                onUnpinMessage={onUnpinMessage}
                canManage={canManage}
                onMarkRead={onMarkRead}
                onDeleteMessage={onDeleteMessage}
                onReply={onReply}
                conversationType={conversationType}
              />
            </div>
          );
        })}
      </div>
    </div>

    {/* Scroll to bottom FAB */}
    {showScrollFab && (
      <button
        onClick={scrollToBottom}
        className="absolute bottom-4 right-4 z-20 h-8 w-8 rounded-full bg-card dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg flex items-center justify-center text-neutral-500 hover:text-primary-600 hover:border-primary-300 transition-all"
        aria-label="Scroll to bottom"
      >
        <AppIcon name="chevronDown" size="sm" />
      </button>
    )}
    </div>
  );
}
