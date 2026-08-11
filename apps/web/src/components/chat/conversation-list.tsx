"use client";

import { useRef, useCallback } from "react";
import { MessageSquare, Users, Globe, Hash } from "lucide-react";
import { format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: any[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 64, []),
    overscan: 5,
  });

  const getIcon = (scope: string) => {
    switch (scope) {
      case "global":
        return <Globe className="w-4 h-4 text-violet-500" />;
      case "project":
        return <Hash className="w-4 h-4 text-blue-500" />;
      case "group":
        return <Users className="w-4 h-4 text-amber-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div ref={parentRef} className="h-full overflow-y-auto relative">
      <div
        className="w-full relative divide-y divide-neutral-100 dark:divide-neutral-800"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const conv = conversations[virtualRow.index];
          const isSelected = selectedId === conv.id;
          const title = conv.name || (conv.scope === "direct" ? conv.users?.[0]?.name || "Direct Message" : "Chat");

          return (
            <div
              key={conv.id || virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              onClick={() => onSelect(conv.id)}
              className={`absolute top-0 left-0 w-full p-3 flex items-start gap-3 cursor-pointer transition-all ${
                isSelected
                  ? "bg-violet-50/60 dark:bg-violet-950/40 border-l-2 border-violet-600"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
              }`}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0 mt-0.5">
                {getIcon(conv.scope)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {title}
                  </h4>
                  {conv.latestMessage && (
                    <span className="text-[10px] text-neutral-400">
                      {format(new Date(conv.latestMessage.created_at), "h:mm a")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
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
