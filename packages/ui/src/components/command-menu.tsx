"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { AppIcon } from "./icon/AppIcon";

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
            <AppIcon name="dashboard" className="mr-2" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory"))}>
            <AppIcon name="directory" className="mr-2" />
            <span>Employee Directory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/attendance"))}>
            <AppIcon name="calendar" className="mr-2" />
            <span>My Attendance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/profile"))}>
            <AppIcon name="profile" className="mr-2" />
            <span>My Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <AppIcon name="settings" className="mr-2" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Time Off Group */}
        <CommandGroup heading="Time Off">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/leave"))}>
            <AppIcon name="plane" className="mr-2" />
            <span>Request Leave</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/leave"))}>
            <AppIcon name="calendar" className="mr-2" />
            <span>View My Leave</span>
          </CommandItem>
          {/* Note: In a real app we'd conditionally render this based on role */}
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/leave?status=pending"))}>
            <AppIcon name="clipboard" className="mr-2" />
            <span>View Pending Approvals</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        
        {/* Admin Group */}
        <CommandGroup heading="Admin">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/departments"))}>
            <AppIcon name="map" className="mr-2" />
            <span>Departments</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/users"))}>
            <AppIcon name="directory" className="mr-2" />
            <span>Manage Users</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        
        {/* Theme Group */}
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <AppIcon name="sun" className="mr-2" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <AppIcon name="moon" className="mr-2" />
            Dark
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <AppIcon name="laptop" className="mr-2" />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
