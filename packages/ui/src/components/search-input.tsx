"use client";

import * as React from "react";
import { Input, InputProps } from "./input";
import { AppIcon } from "./icon/AppIcon";
import { useDebouncedValidation } from "../hooks/use-debounced-validation";
import { cn } from "../utils/cn";

export interface SearchInputProps extends Omit<InputProps, "onChange"> {
  onChange?: (value: string) => void;
  debounceMs?: number;
  minLength?: number;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onChange, debounceMs = 300, minLength = 0, value, defaultValue, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState((value as string) || (defaultValue as string) || "");

    const debouncedValue = useDebouncedValidation(localValue, (v) => v, debounceMs);

    React.useEffect(() => {
      if (onChange) {
        if (debouncedValue && debouncedValue.length >= minLength) {
          onChange(debouncedValue);
        } else if (!debouncedValue || debouncedValue.length < minLength) {
          onChange(""); // Treat as empty if below threshold
        }
      }
    }, [debouncedValue, minLength, onChange]);

    // Sync external value changes
    React.useEffect(() => {
      if (value !== undefined && value !== localValue) {
        setLocalValue(value as string);
      }
    }, [value]);

    return (
      <div className="relative w-full md:w-64">
        <AppIcon 
          name="search" 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-70" 
          size="sm"
        />
        <Input
          ref={ref}
          type="search"
          className={cn("pl-9", className)}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
