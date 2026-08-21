import { useState, useRef, useEffect } from "react";
import { AppIcon, Avatar, AvatarFallback, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@g4k/ui/components";
import { cn } from "@/lib/utils";
import { Button } from "@g4k/ui/components";
import { FileUploadPopup } from "@g4k/ui/components";

interface ComposerUser {
  id: number;
  name?: string;
}
interface ComposerConversation {
  users?: ComposerUser[];
}
interface ReplyMessage {
  id: number;
  body?: string;
  sender?: { name?: string };
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👀", "🙌", "✅", "💯", "🚀", "🤔", "👏", "✨", "😊", "🙏"];

export function MessageComposer({
  onSend,
  disabled,
  conversation,
  replyTo,
  onCancelReply,
}: {
  onSend: (body: string, mentions?: number[], attachment?: File | null) => void;
  disabled?: boolean;
  conversation?: ComposerConversation;
  replyTo?: ReplyMessage | null;
  onCancelReply?: () => void;
}) {
  const [text, setText] = useState("");
  const [isOffline, setIsOffline] = useState(typeof window !== "undefined" ? !navigator.onLine : false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [selectedMentions, setSelectedMentions] = useState<number[]>([]);
  const [mentionNavIndex, setMentionNavIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showUploadPopup, setShowUploadPopup] = useState(false);


  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) {
    setPrevText(text);
    const match = text.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(text.lastIndexOf("@"));
      setShowMentions(true);
      setMentionNavIndex(0);
    } else {
      setShowMentions(false);
    }
  }

  const filteredUsers = conversation?.users?.filter((u: ComposerUser) => 
    (u.name || "").toLowerCase().includes(mentionQuery.toLowerCase())
  ) || [];

  const handleMentionSelect = (user: ComposerUser) => {
    if (mentionIndex !== -1) {
      const before = text.substring(0, mentionIndex);
      setText(before + `@${user.name || "user"} `);
      setSelectedMentions([...selectedMentions, user.id]);
    }
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleEmojiSelect = (emoji: string) => {
    setText(text + emoji);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (text.trim() || selectedFile) {
      onSend(text.trim(), selectedMentions, selectedFile);
      setText("");
      setSelectedMentions([]);
      setSelectedFile(null);
      if (onCancelReply) onCancelReply();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleMentionSelect(filteredUsers[mentionNavIndex]);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionNavIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionNavIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
    }
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="relative p-3 border-t border-neutral-100 dark:border-neutral-800 bg-card dark:bg-neutral-900 flex items-center gap-2">
      {/* Mentions Dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-12 mb-2 w-64 bg-card dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[var(--radius)] shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Mentions</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto thin-scrollbar">
            {filteredUsers.map((u: ComposerUser, idx: number) => (
              <button
                key={u.id}
                onClick={() => handleMentionSelect(u)}
                onMouseEnter={() => setMentionNavIndex(idx)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${mentionNavIndex === idx ? "bg-neutral-100 dark:bg-neutral-700" : "hover:bg-neutral-50 dark:hover:bg-neutral-700/50"}`}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback name={u.name || 'U'} className="text-[9px]" />
                </Avatar>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">{u.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}


      <FileUploadPopup 
        open={showUploadPopup} 
        onOpenChange={setShowUploadPopup} 
        title="Share File" 
        description="Select a file to share in this conversation. Maximum size is 10MB."
        maxSizeMB={10}
        acceptedTypes={[]} 
        onUpload={async (file) => {
          setSelectedFile(file);
          setShowUploadPopup(false);
        }} 
      />



      <div className="flex flex-col flex-1 min-w-0 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-e1 focus-within:shadow-e2 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
        {replyTo && (
          <div className="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] min-w-0">
              <AppIcon name="arrowLeft" size="xs" className="text-primary-500" />
              <span className="font-bold text-neutral-700 dark:text-neutral-300 shrink-0">Replying to {replyTo.sender?.name}:</span>
              <span className="text-neutral-500 truncate">{replyTo.body}</span>
            </div>
            {onCancelReply && (
              <button onClick={onCancelReply} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 ml-2 shrink-0">
                <AppIcon name="close" size="xs" />
              </button>
            )}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (use @ to mention)"
          className={`w-full text-xs bg-transparent p-2.5 resize-none focus:outline-none max-h-[120px] thin-scrollbar ${replyTo ? 'rounded-b-xl' : 'rounded-xl'}`}
          rows={1}
        />
        <div className="px-2.5 pb-1.5 flex justify-between items-center text-[9px] text-neutral-400">
          <span>{text.length > 0 ? `${text.length}/2000` : ''}</span>
        </div>
      </div>

      <div className="flex items-end gap-2 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-neutral-500 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            disabled={disabled}
            onClick={() => setShowUploadPopup(true)}
            title="Attach file"
          >
            <AppIcon name="paperclip" className="h-5 w-5" />
          </Button>

          {isOffline && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-xs font-medium rounded-full shrink-0 mr-1" title="Messages will be sent when you reconnect">
              <AppIcon name="wifiOff" className="h-3 w-3" />
              <span className="hidden sm:inline">Offline (Queuing)</span>
            </div>
          )}

          <Button
            type="submit"
            size="icon"
            onClick={handleSend}
            className={cn(
              "h-10 w-10 shrink-0 rounded-full shadow-sm transition-all",
              text.trim() || selectedFile
                ? "bg-primary hover:bg-primary/90 text-white shadow-md scale-100"
                : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
            )}
            disabled={disabled || (!text.trim() && !selectedFile)}
          >
            <AppIcon name="send" className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
    </div>
  );
}
