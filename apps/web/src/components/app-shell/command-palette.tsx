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
  Play,
  Coffee,
  Square,
  FileEdit,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { useTimerStore } from "@/stores/timer-store";
import { offlineEngine } from "@/lib/offline-engine";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { apiFetch } from "@/lib/api-client";
import { useRecentStore } from "@/stores/recent-store";
import { formatDistanceToNow } from "date-fns";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@g4k/ui/components";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isActive, isOnBreak } = useTimerStore();
  const { data: capabilities = [] } = useCapabilities();
  const { recentItems } = useRecentStore();

  const isHrOrAdmin = hasCapability(capabilities, "hr.view-team-attendance") || hasCapability(capabilities, "admin.view-all-attendance");
  const canCorrect = hasCapability(capabilities, "admin.correct-attendance") || hasCapability(capabilities, "hr.correct-attendance") || isHrOrAdmin;

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

  const handleExport = async () => {
    try {
      const res = await apiFetch("/attendance/export");
      if (res.download_url) {
        window.location.href = res.download_url;
      } else {
        toast.success("Export started successfully.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search workspace..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {!search && recentItems.length > 0 && (
          <CommandGroup heading="Recently Viewed">
            {recentItems.map((item) => (
              <CommandItem key={`${item.type}-${item.id}`} onSelect={() => runCommand(() => router.push(item.url))}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <UserCircle className="w-4 h-4 mr-2 opacity-70" />
                    <div className="flex flex-col">
                      <span className="text-sm">{item.title}</span>
                      {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {isHrOrAdmin && (
          <CommandGroup heading="HR Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/attendance"))}>
              <Users className="w-4 h-4 mr-2" />
              <span>View Team Attendance</span>
            </CommandItem>
            {canCorrect && (
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/attendance?correction=true"))}>
                <FileEdit className="w-4 h-4 mr-2" />
                <span>Correct Attendance</span>
              </CommandItem>
            )}
            <CommandItem onSelect={() => runCommand(handleExport)}>
              <Download className="w-4 h-4 mr-2" />
              <span>Export Team Report</span>
            </CommandItem>
          </CommandGroup>
        )}
        
        <CommandGroup heading="Attendance">
          {!isActive && (
            <CommandItem onSelect={() => runCommand(async () => {
              const ts = new Date().toISOString();
              useTimerStore.getState().startTimer(ts, 0);
              try { await offlineEngine.recordPunch("clock_in", ts); toast.success("Clocked In"); } 
              catch(err: any) { toast.error(err.message); }
            })}>
              <Play className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Clock In</span>
            </CommandItem>
          )}
          {isActive && !isOnBreak && (
            <CommandItem onSelect={() => runCommand(async () => {
              const ts = new Date().toISOString();
              useTimerStore.getState().startBreak(ts);
              try { await offlineEngine.recordPunch("break_start", ts); toast.success("Break Started"); } 
              catch(err: any) { toast.error(err.message); }
            })}>
              <Coffee className="w-4 h-4 mr-2 text-amber-500" />
              <span>Start Break</span>
            </CommandItem>
          )}
          {isOnBreak && (
            <CommandItem onSelect={() => runCommand(async () => {
              const ts = new Date().toISOString();
              const { activeSeconds, startTimer } = useTimerStore.getState();
              startTimer(ts, activeSeconds);
              try { await offlineEngine.recordPunch("break_end", ts); toast.success("Break Ended"); } 
              catch(err: any) { toast.error(err.message); }
            })}>
              <Play className="w-4 h-4 mr-2 text-emerald-500" />
              <span>End Break & Resume Work</span>
            </CommandItem>
          )}
          {isActive && (
            <CommandItem onSelect={() => runCommand(async () => {
              const ts = new Date().toISOString();
              const state = useTimerStore.getState();
              if (state.isOnBreak) {
                await offlineEngine.recordPunch("break_end", ts);
                state.endBreak();
              }
              state.stopTimer();
              try { await offlineEngine.recordPunch("clock_out", ts); toast.success("Clocked Out"); } 
              catch(err: any) { toast.error(err.message); }
            })}>
              <Square className="w-4 h-4 mr-2 text-rose-500" />
              <span>Clock Out</span>
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/attendance"))}>
            <Clock className="w-4 h-4 mr-2" />
            <span>View Attendance History</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/attendance"))}>
            <Coffee className="w-4 h-4 mr-2 text-violet-500" />
            <span>Request Leave</span>
          </CommandItem>
        </CommandGroup>

        {isHrOrAdmin && (
          <CommandGroup heading="Admin Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/admin/attendance"))}>
              <Users className="w-4 h-4 mr-2 text-emerald-500" />
              <span>View Company Attendance</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/admin/reports"))}>
              <Download className="w-4 h-4 mr-2 text-blue-500" />
              <span>Generate Attendance Summary</span>
            </CommandItem>
          </CommandGroup>
        )}

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
