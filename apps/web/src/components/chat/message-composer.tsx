import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, User } from "lucide-react";
import { Button } from "@g4k/ui/components";
import { FileUploadPopup } from "@g4k/ui/components";

export function MessageComposer({
  onSend,
  disabled,
  conversation,
}: {
  onSend: (body: string, mentions?: number[], attachment?: File | null) => void;
  disabled?: boolean;
  conversation?: any;
}) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [selectedMentions, setSelectedMentions] = useState<number[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showUploadPopup, setShowUploadPopup] = useState(false);


  useEffect(() => {
    // Detect @ typing
    const match = text.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(text.lastIndexOf("@"));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [text]);

  const filteredUsers = conversation?.users?.filter((u: any) => 
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ) || [];

  const handleMentionSelect = (user: any) => {
    if (mentionIndex !== -1) {
      const before = text.substring(0, mentionIndex);
      setText(before + `@${user.name} `);
      setSelectedMentions([...selectedMentions, user.id]);
    }
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim(), selectedMentions);
      setText("");
      setSelectedMentions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleMentionSelect(filteredUsers[0]);
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
    }
  };

  return (
    <div className="relative p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2">
      {/* Mentions Dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-12 mb-2 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {filteredUsers.map((u: any) => (
            <button
              key={u.id}
              onClick={() => handleMentionSelect(u)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
            >
              <User className="w-3 h-3 text-neutral-400" />
              {u.name}
            </button>
          ))}
        </div>
      )}


      <FileUploadPopup 
        open={showUploadPopup} 
        onOpenChange={setShowUploadPopup} 
        title="Share File" 
        description="Select a file to share in this conversation."
        maxSizeMB={10}
        acceptedTypes={[]} 
        onUpload={async (file) => {
          onSend(text.trim() || '', selectedMentions, file);
          setText("");
          setSelectedMentions([]);
          setShowUploadPopup(false);
        }} 
      />

      <Button 
        size="icon" 
        variant="ghost" 
        className="h-9 w-9 text-neutral-400 shrink-0" 
        aria-label="Add attachment"
        onClick={() => setShowUploadPopup(true)}
      >
        <Paperclip className="w-4 h-4" />
      </Button>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (use @ to mention)"
        className="flex-1 text-xs bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-xl border-none resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
        rows={1}
      />

      <Button
        size="icon"
        disabled={disabled || !text.trim()}
        onClick={handleSend}
        className="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shrink-0"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
