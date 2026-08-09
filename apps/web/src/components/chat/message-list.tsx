"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Paperclip } from "lucide-react";

export function MessageList({
  messages,
  currentUserId,
}: {
  messages: any[];
  currentUserId: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => {
        const isMe = msg.sender_id === currentUserId;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
          >
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
      })}
    </div>
  );
}
