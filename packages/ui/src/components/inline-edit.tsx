"use client";
import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "../utils/cn"
import { Input } from "./input"

export interface InlineEditProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string;
  onSave: (value: string) => void;
  inputClassName?: string;
  textClassName?: string;
  type?: string;
  displayValue?: React.ReactNode;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, className, inputClassName, textClassName, type = "text", displayValue, placeholder, ...props }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue.trim() !== value) {
      onSave(currentValue.trim());
    } else {
      setCurrentValue(value); // reset
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(value); // revert
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={currentValue}
        placeholder={placeholder}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-7 py-1 px-2", inputClassName)}
      />
    );
  }

  return (
    <div
      className={cn("cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 -ml-1 transition-colors", className)}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      {...props}
    >
      {value ? <span className={textClassName}>{displayValue || value}</span> : <span className="text-neutral-400 italic">{placeholder || "Empty"}</span>}
    </div>
  );
}
