import React, { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Input } from "./input";
import { cn } from "../utils/cn";

export interface InlineEditProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, className, inputClassName, placeholder = "Enter value..." }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentValue.trim() !== value) {
      onSave(currentValue.trim());
    } else {
      setCurrentValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-7 px-2 py-1 text-sm", inputClassName)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded px-1.5 py-0.5 -ml-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className={cn("truncate", !value && "text-muted-foreground italic")}>
        {value || placeholder}
      </span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}
