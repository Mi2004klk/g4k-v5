"use client";

import { useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@g4k/ui/components";

export function MessageComposer({
  onSend,
  disabled,
}: {
  onSend: (body: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSend(text.trim());
        setText("");
      }
    }
  };

  return (
    <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2">
      <Button size="icon" variant="ghost" className="h-9 w-9 text-neutral-400" aria-label="Add attachment">
        <Paperclip className="w-4 h-4" />
      </Button>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Shift+Enter for newline)"
        className="flex-1 text-xs bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-xl border-none resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
        rows={1}
      />

      <Button
        size="icon"
        disabled={disabled || !text.trim()}
        onClick={() => {
          if (text.trim()) {
            onSend(text.trim());
            setText("");
          }
        }}
        className="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
