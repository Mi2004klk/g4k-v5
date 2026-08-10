"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Users,
  Map,
  Moon,
  Sun,
  Laptop,
  Plane,
  ClipboardList
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Navigation Group */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Employee Directory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/attendance"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>My Attendance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/profile"))}>
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Time Off Group */}
        <CommandGroup heading="Time Off">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/leave"))}>
            <Plane className="mr-2 h-4 w-4" />
            <span>Request Leave</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/leave"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>View My Leave</span>
          </CommandItem>
          {/* Note: In a real app we'd conditionally render this based on role */}
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/leave?status=pending"))}>
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>View Pending Approvals</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        
        {/* Admin Group */}
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

        <CommandSeparator />
        
        {/* Theme Group */}
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
