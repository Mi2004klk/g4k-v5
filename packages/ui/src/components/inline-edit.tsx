"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { AppIcon } from "./icon/AppIcon";
import { cn } from "../utils/cn";
import { DatePicker } from "./date-picker";

export type InlineEditType = "text" | "date";

export interface InlineEditProps {
  value: string | undefined | null;
  displayValue?: React.ReactNode;
  onSave: (val: string) => Promise<void> | void;
  type?: InlineEditType;
  placeholder?: string;
  className?: string;
  textClassName?: string;
  inputClassName?: string;
}

export function InlineEdit({
  value,
  displayValue,
  onSave,
  type = "text",
  placeholder = "Click to edit...",
  className,
  textClassName,
  inputClassName,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  useEffect(() => {
    if (isEditing && type === "text" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing, type]);

  const handleSave = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (e) {
      // Keep editing if it failed
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave(currentValue);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setCurrentValue(value || "");
    }
  };

  if (isEditing) {
    return (
      <div className={cn("relative inline-block w-full max-w-sm", className)}>
        {type === "text" ? (
          <Input
            ref={inputRef}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={() => handleSave(currentValue)}
            onKeyDown={handleKeyDown}
            className={cn("h-7 px-2 py-1 text-sm bg-surface shadow-sm", inputClassName)}
            disabled={isLoading}
          />
        ) : type === "date" ? (
          <DatePicker
            value={currentValue ? new Date(currentValue) : undefined}
            onChange={(d) => {
              if (!d) {
                setIsEditing(false);
                return;
              }
              const ds = d.toISOString().split("T")[0];
              setCurrentValue(ds);
              handleSave(ds);
            }}
            className={cn("h-7 text-sm", inputClassName)}
            disabled={isLoading}
          />
        ) : null}
        
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AppIcon name="loading" spin size="xs" className="text-neutral-400" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "group cursor-pointer rounded px-1.5 py-0.5 -ml-1.5 border border-transparent hover:border-border hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 max-w-full",
        className
      )}
      title="Click to edit"
    >
      <span className={cn("truncate min-w-8", !value && "text-neutral-400 italic", textClassName)}>
        {displayValue !== undefined ? displayValue : (value || placeholder)}
      </span>
      <AppIcon 
        name="edit" 
        size="xs" 
        className="opacity-0 group-hover:opacity-100 text-neutral-400 shrink-0" 
      />
    </div>
  );
}
