"use client";

import * as React from "react";
import { cn } from "../utils/cn";
import { AppIcon } from "./icon/AppIcon";
import { Button } from "./button";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { Badge } from "./badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { useDebouncedValidation } from "../hooks/use-debounced-validation";

export interface UserPickerUser {
  id: number;
  name: string;
  avatar_url?: string;
  designation?: { name?: string };
  department?: { name?: string };
  active_role?: string;
  email?: string;
}

export interface UserPickerProps {
  mode?: "single" | "multi";
  value?: number | number[]; // user IDs
  onChange?: (value: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  users?: UserPickerUser[];
  isLoading?: boolean;
  search?: string;
  onSearchChange?: (search: string) => void;
  resolveAvatar?: (url?: string | null) => string | undefined;
}

export function UserPicker({
  mode = "single",
  value,
  onChange,
  placeholder = "Select user...",
  className,
  disabled = false,
  users = [],
  isLoading = false,
  search = "",
  onSearchChange,
  resolveAvatar = (url) => (url ? url : undefined),
}: UserPickerProps) {
  const [open, setOpen] = React.useState(false);

  // Keep track of selected user objects for rendering chips/display
  const [selectedUsers, setSelectedUsers] = React.useState<UserPickerUser[]>([]);

  // Fetch full user details for pre-selected IDs if they aren't in the search results
  // For simplicity, we assume the parent handles the initial state well, or we just rely on ID if not loaded.
  // In a robust implementation, you might fetch the initial users by ID.
  // For now, we update selectedUsers when value changes and we have the users in the list.
  React.useEffect(() => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      setSelectedUsers([]);
      return;
    }
    
    if (mode === "single") {
      const existing = selectedUsers.find(u => u.id === value);
      if (!existing) {
        const found = users.find(u => u.id === value);
        if (found) setSelectedUsers([found]);
      }
    } else {
      const valArray = value as number[];
      // Keep existing selected users that are still in value array
      let newSelected = selectedUsers.filter(u => valArray.includes(u.id));
      // Find newly selected users from the current search results
      const newlySelected = valArray.filter(id => !newSelected.find(u => u.id === id));
      
      newlySelected.forEach(id => {
        const found = users.find(u => u.id === id);
        if (found) newSelected.push(found);
        else {
          // Placeholder for missing user data (if they were preselected but not in current search)
          // In reality you'd fetch by ID here.
          newSelected.push({ id, name: `User ${id}` });
        }
      });
      setSelectedUsers(newSelected);
    }
  }, [value, users, mode]);

  const toggleUser = (user: UserPickerUser) => {
    if (mode === "single") {
      onChange?.(user.id);
      setOpen(false);
    } else {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(user.id)) {
        onChange?.(currentValues.filter(id => id !== user.id));
      } else {
        onChange?.([...currentValues, user.id]);
      }
    }
  };

  const removeUser = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (mode === "single") {
      onChange?.(undefined);
    } else {
      const currentValues = Array.isArray(value) ? value : [];
      onChange?.(currentValues.filter(v => v !== id));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-auto min-h-[2.5rem] py-1.5 px-3", className)}
          disabled={disabled}
        >
          {selectedUsers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 items-center w-full pr-4">
              {mode === "single" ? (
                <div className="flex items-center gap-2 truncate">
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage src={resolveAvatar(selectedUsers[0].avatar_url) || ""} />
                    <AvatarFallback name={selectedUsers[0].name} className="text-[10px]" />
                  </Avatar>
                  <span className="truncate">{selectedUsers[0].name}</span>
                </div>
              ) : (
                selectedUsers.map((u) => (
                  <Badge key={u.id} variant="secondary" className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 max-w-full">
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarImage src={resolveAvatar(u.avatar_url) || ""} />
                      <AvatarFallback name={u.name} className="text-[9px]" />
                    </Avatar>
                    <span className="truncate max-w-[100px] text-xs">{u.name}</span>
                    <button
                      className="ml-1 shrink-0 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-0.5 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") removeUser(e as any, u.id);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => removeUser(e, u.id)}
                    >
                      <AppIcon name="close" size="xs" className="h-3 w-3 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100" />
                      <span className="sr-only">Remove {u.name}</span>
                    </button>
                  </Badge>
                ))
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <AppIcon name="chevronsUpDown" className="ml-2 shrink-0 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search users..." 
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-xs text-neutral-500">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => {
                    const isSelected = mode === "single" 
                      ? value === user.id 
                      : (Array.isArray(value) && value.includes(user.id));
                      
                    return (
                      <CommandItem
                        key={user.id}
                        value={user.id.toString()}
                        onSelect={() => toggleUser(user)}
                        className="flex items-center gap-2 px-2 py-1.5"
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-input opacity-50 [&_svg]:invisible"
                        )}>
                          <AppIcon name="check" size="xs" className="h-3 w-3" />
                        </div>
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={resolveAvatar(user.avatar_url) || ""} />
                          <AvatarFallback name={user.name} className="text-[10px]" />
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate leading-none mb-1">{user.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate leading-none">
                            {user.department?.name || user.active_role?.replace('_', ' ') || "Employee"}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
