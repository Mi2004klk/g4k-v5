"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LayoutDashboard, Users, User, Map } from "lucide-react";

export function GlobalCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Employee Directory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/profile"))}>
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading="Admin">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/departments"))}>
            <Map className="mr-2 h-4 w-4" />
            <span>Departments</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/users"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Manage Users</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
