"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Clock,
  Settings,
  FolderKanban,
  UserCircle,
  Building2,
  Briefcase,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

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
      <CommandInput placeholder="Type a command or search workspace..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory"))}>
            <Users className="w-4 h-4 mr-2" />
            <span>Employee Directory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/users"))}>
            <Users className="w-4 h-4 mr-2" />
            <span>User Accounts Management</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/departments"))}>
            <Building2 className="w-4 h-4 mr-2" />
            <span>Departments & Teams</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/designations"))}>
            <Briefcase className="w-4 h-4 mr-2" />
            <span>Designations Master</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/profile"))}>
            <UserCircle className="w-4 h-4 mr-2" />
            <span>My Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <Settings className="w-4 h-4 mr-2" />
            <span>Admin Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Theme Controls">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="w-4 h-4 mr-2" />
            <span>Switch to Light Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="w-4 h-4 mr-2" />
            <span>Switch to Dark Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="w-4 h-4 mr-2" />
            <span>Use System Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
