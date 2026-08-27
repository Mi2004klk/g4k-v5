"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AppIcon, IconName } from "@g4k/ui/components";
import { toast } from "sonner";
import { useTimerStore } from "@/stores/timer-store";
import { offlineEngine } from "@/lib/offline-engine";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { apiFetch } from "@/lib/api-client";
import { useRecentStore } from "@/stores/recent-store";
import { safeFromNow } from "@/lib/format";

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
  const isActive = useTimerStore((s) => s.isActive);
  const isOnBreak = useTimerStore((s) => s.isOnBreak);
  const { data: capabilities = [] } = useCapabilities();
  const { recentItems } = useRecentStore();

  const isHrOrAdmin = hasCapability(capabilities, "hr.view-team-attendance") || hasCapability(capabilities, "admin.view-all-attendance");
  const canCorrect = hasCapability(capabilities, "admin.correct-attendance") || hasCapability(capabilities, "attendance.correct-team") || isHrOrAdmin;
  const canClockSelf = hasCapability(capabilities, "attendance.clock-self");

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
      <CommandInput placeholder="Type a command or navigate..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {!search && recentItems.length > 0 && (
          <CommandGroup heading="Recently Viewed">
            {recentItems.map((item) => (
              <CommandItem key={`${item.type}-${item.id}`} onSelect={() => runCommand(() => router.push(item.url))}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <AppIcon name="profile" className=" mr-2 opacity-70" />
                    <div className="flex flex-col">
                      <span className="text-sm">{item.title}</span>
                      {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{safeFromNow(item.timestamp)}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {isHrOrAdmin && (
          <CommandGroup heading="HR Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/attendance"))}>
              <AppIcon name="directory" className=" mr-2" />
              <span>View Team Attendance</span>
            </CommandItem>
            {canCorrect && (
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/attendance?correction=true"))}>
                <AppIcon name="edit" className=" mr-2" />
                <span>Correct Attendance</span>
              </CommandItem>
            )}
            <CommandItem onSelect={() => runCommand(handleExport)}>
              <AppIcon name="download" className=" mr-2" />
              <span>Export Team Report</span>
            </CommandItem>
          </CommandGroup>
        )}
        
        <CommandGroup heading="Attendance">
          {canClockSelf && (
            <>
              {!isActive && (
                <CommandItem onSelect={() => runCommand(async () => {
                  const ts = new Date().toISOString();
                  useTimerStore.getState().startTimer(ts, 0);
                  try { 
                    await offlineEngine.recordPunch("clock_in", ts); 
                    if (!navigator.onLine) toast.warning("Offline. Clock In queued."); else toast.success("Clocked In"); 
                  } catch(err: any) { toast.error(err.message); }
                })}>
                  <AppIcon name="play" className=" mr-2 text-emerald-500" />
                  <span>Clock In</span>
                </CommandItem>
              )}
              {isActive && !isOnBreak && (
                <CommandItem onSelect={() => runCommand(async () => {
                  const ts = new Date().toISOString();
                  useTimerStore.getState().startBreak(ts);
                  try { 
                    await offlineEngine.recordPunch("break_start", ts); 
                    if (!navigator.onLine) toast.warning("Offline. Break Start queued."); else toast.success("Break Started"); 
                  } catch(err: any) { toast.error(err.message); }
                })}>
                  <AppIcon name="break" className=" mr-2 text-amber-500" />
                  <span>Start Break</span>
                </CommandItem>
              )}
              {isOnBreak && (
                <CommandItem onSelect={() => runCommand(async () => {
                  const ts = new Date().toISOString();
                  const { endBreak } = useTimerStore.getState();
                  endBreak(ts);
                  try { 
                    await offlineEngine.recordPunch("break_end", ts); 
                    if (!navigator.onLine) toast.warning("Offline. Break End queued."); else toast.success("Break Ended"); 
                  } catch(err: any) { toast.error(err.message); }
                })}>
                  <AppIcon name="play" className=" mr-2 text-emerald-500" />
                  <span>End Break & Resume Work</span>
                </CommandItem>
              )}
              {isActive && (
                <CommandItem onSelect={() => runCommand(async () => {
                  const ts = new Date().toISOString();
                  const state = useTimerStore.getState();
                  if (state.isOnBreak) {
                    await offlineEngine.recordPunch("break_end", ts);
                    state.endBreak(ts);
                  }
                  state.stopTimer();
                  try { 
                    await offlineEngine.recordPunch("clock_out", ts); 
                    if (!navigator.onLine) toast.warning("Offline. Clock Out queued."); else toast.success("Clocked Out"); 
                  } catch(err: any) { toast.error(err.message); }
                })}>
                  <AppIcon name="stop" className=" mr-2 text-rose-600" />
                  <span>Clock Out</span>
                </CommandItem>
              )}
            </>
          )}
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/attendance"))}>
            <AppIcon name="teamAttendance" className=" mr-2" />
            <span>View Attendance History</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/attendance?tab=leave"))}>
            <AppIcon name="break" className=" mr-2 text-primary-500" />
            <span>Request Leave</span>
          </CommandItem>
        </CommandGroup>

        {isHrOrAdmin && (
          <CommandGroup heading="Admin Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/attendance?tab=today"))}>
              <AppIcon name="directory" className=" mr-2 text-emerald-500" />
              <span>View Company Attendance</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/org/attendance"))}>
              <AppIcon name="teamAttendance" className=" mr-2 text-blue-500" />
              <span>Admin Attendance Overview</span>
            </CommandItem>
            {hasCapability(capabilities, "reports.view") && (
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/reports"))}>
                <AppIcon name="spreadsheet" className=" mr-2 text-primary-500" />
                <span>Reports & Analytics</span>
              </CommandItem>
            )}
          </CommandGroup>
        )}

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <AppIcon name="dashboard" className=" mr-2" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory"))}>
            <AppIcon name="directory" className=" mr-2" />
            <span>Employee Directory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory?tab=management"))}>
            <AppIcon name="directory" className=" mr-2" />
            <span>User Accounts Management</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory?tab=departments"))}>
            <AppIcon name="building" className=" mr-2" />
            <span>Departments & Teams</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/directory?tab=designations"))}>
            <AppIcon name="briefcase" className=" mr-2" />
            <span>Designations Master</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/profile"))}>
            <AppIcon name="profile" className=" mr-2" />
            <span>My Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/profile?tab=settings"))}>
            <AppIcon name="settings" className=" mr-2" />
            <span>Admin Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Theme Controls">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <AppIcon name="sun" className=" mr-2" />
            <span>Switch to Light Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <AppIcon name="moon" className=" mr-2" />
            <span>Switch to Dark Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <AppIcon name="laptop" className=" mr-2" />
            <span>Use System Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
