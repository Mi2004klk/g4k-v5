"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useState, useEffect, useCallback } from "react";

const EMPTY_CAPABILITIES: any[] = [];
const EMPTY_PINS: any[] = [];
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Briefcase,
  UserCircle,
  Sun,
  Moon,
  CalendarDays,
  FolderKanban,
  CalendarCheck,
  Megaphone,
  BarChart3,
  CheckSquare,
  MessageSquare,
  ShieldAlert,
  Menu,
  Star,
  Rows3,
  Rows2,
  Check,
  Command,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { SheetDescription, Button } from "@g4k/ui/components";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { useTheme } from "next-themes";
import { queryKeys } from "@/lib/query-keys";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useUIStore } from "@/lib/ui-store";

import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { Breadcrumb } from "@/components/app-shell/breadcrumb";
import { NotificationsBell } from "@/components/app-shell/notifications-bell";
import { TopbarTimer } from "@/components/app-shell/topbar-timer";
import { NavGroup, NavItem } from "@/components/app-shell/nav-group";
import { ReverbProvider } from "@/hooks/use-reverb";
import { HelpOverlay, Avatar, AvatarFallback } from "@g4k/ui/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@g4k/ui/components";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@g4k/ui/components";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";

export const navGroups = [
  { label: "My Work", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban, capability: "projects.manage" },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, capability: "tasks.submit" },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare, capability: "directory.send-message" },
    { name: "Announcement", href: "/dashboard/announcements", icon: Megaphone },
    { name: "Leave & Time Off", href: "/dashboard/leave", icon: CalendarDays, capability: "leave.request-self" },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3, capability: "reports.view" },
  ]},
  { label: "People", items: [
    { name: "Directory", href: "/dashboard/directory", icon: Users, capability: "directory.view" },
    { name: "Employees", href: "/dashboard/org/users", icon: Users, capability: "users.employee.manage" },
    { name: "Team Attendance", href: "/dashboard/org/attendance", icon: Clock, capability: "hr.view-team-attendance" },
    { name: "Org Leave Approvals", href: "/dashboard/org/leave", icon: CalendarDays, capability: "leave.approve-employee" },
    { name: "Departments", href: "/dashboard/org/departments", icon: Building2, capability: "departments.manage" },
    { name: "Designations", href: "/dashboard/org/designations", icon: Briefcase, capability: "designations.manage" },
  ]},
  { label: "Administration", items: [
    { name: "Settings", href: "/dashboard/settings", icon: Settings, capability: "settings.manage" },
    { name: "Audit Log", href: "/dashboard/audit", icon: ShieldAlert, capability: "audit.view" },
  ]},
  { label: "Account", items: [
    { name: "My Profile", href: "/dashboard/profile", icon: UserCircle, capability: "profile.edit" },
  ]},
];

const accentClasses: Record<string, { bg: string; text: string; bgDark: string; textDark: string; border: string }> = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", bgDark: "dark:bg-emerald-950", textDark: "dark:text-emerald-300", border: "bg-emerald-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", bgDark: "dark:bg-amber-950", textDark: "dark:text-amber-300", border: "bg-amber-600" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", bgDark: "dark:bg-pink-950", textDark: "dark:text-pink-300", border: "bg-pink-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", bgDark: "dark:bg-blue-950", textDark: "dark:text-blue-300", border: "bg-blue-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", bgDark: "dark:bg-slate-900", textDark: "dark:text-slate-300", border: "bg-slate-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-700", bgDark: "dark:bg-rose-950", textDark: "dark:text-rose-300", border: "bg-rose-600" },
  violet: { bg: "bg-violet-100", text: "text-violet-700", bgDark: "dark:bg-violet-950", textDark: "dark:text-violet-300", border: "bg-violet-600" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-700", bgDark: "dark:bg-indigo-950", textDark: "dark:text-indigo-300", border: "bg-indigo-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-700", bgDark: "dark:bg-teal-950", textDark: "dark:text-teal-300", border: "bg-teal-600" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-700", bgDark: "dark:bg-cyan-950", textDark: "dark:text-cyan-300", border: "bg-cyan-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", bgDark: "dark:bg-orange-950", textDark: "dark:text-orange-300", border: "bg-orange-600" },
  green: { bg: "bg-green-100", text: "text-green-700", bgDark: "dark:bg-green-950", textDark: "dark:text-green-300", border: "bg-green-600" },
};

function getAccent(href: string) {
  let color = "violet";
  if (href === "/dashboard") color = "blue";
  else if (href.startsWith("/dashboard/attendance")) color = "green";
  else if (href.startsWith("/dashboard/projects")) color = "indigo";
  else if (href.startsWith("/dashboard/tasks")) color = "green";
  else if (href.startsWith("/dashboard/chat")) color = "pink";
  else if (href.startsWith("/dashboard/announcements")) color = "orange";
  else if (href.startsWith("/dashboard/leave")) color = "amber";
  else if (href.startsWith("/dashboard/reports")) color = "violet";
  else if (href.startsWith("/dashboard/directory")) color = "pink";
  else if (href.startsWith("/dashboard/org/users")) color = "indigo";
  else if (href.startsWith("/dashboard/org/attendance")) color = "green";
  else if (href.startsWith("/dashboard/org/leave")) color = "amber";
  else if (href.startsWith("/dashboard/org/departments")) color = "indigo";
  else if (href.startsWith("/dashboard/org/designations")) color = "indigo";
  else if (href.startsWith("/dashboard/profile")) color = "cyan";
  else if (href.startsWith("/dashboard/settings")) color = "teal";
  else if (href.startsWith("/dashboard/audit")) color = "rose";
  return accentClasses[color];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarState = useUIStore((s) => s.sidebarState);
  const isInitialized = useUIStore((s) => s.isInitialized);
  const cycleSidebarState = useUIStore((s) => s.cycleSidebarState);
  const setSidebarStateSilent = useUIStore((s) => s.setSidebarStateSilent);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: userCapabilities = EMPTY_CAPABILITIES } = useCapabilities();
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const density = useAuthStore((s) => s.density);
  const setDensity = useAuthStore((s) => s.setDensity);
  const { theme, setTheme } = useTheme();

  const { data: initData, refetch: refetchPins } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
    staleTime: 5 * 60_000,
  });
  const pins = initData?.pins || EMPTY_PINS;
  const preferencesData = initData?.preferences ? { preferences: initData.preferences } : null;

  useEffect(() => {
    // Prefetch consolidated dashboard init data on cold load
    if (!authUser) return;
    queryClient.prefetchQuery({ queryKey: queryKeys.dashboardInit, queryFn: () => apiFetch("/dashboard/init") });
  }, [authUser, queryClient]);

  useEffect(() => {
    if (preferencesData?.preferences?.sidebar_state && !isInitialized) {
      setSidebarStateSilent(preferencesData.preferences.sidebar_state);
      useUIStore.setState({ isInitialized: true });
    }
  }, [preferencesData, setSidebarStateSilent, isInitialized]);

  const handleTogglePin = useCallback(async (item: any, existingPin: any) => {
    try {
      if (existingPin) {
        await apiFetch(`/pins/${existingPin.id}`, { method: "DELETE" });
        refetchPins();
        toast("Unpinned from sidebar", {
          action: { label: "Undo", onClick: () => handleTogglePin(item, null) },
          duration: 5000,
        });
      } else {
        const res = await apiFetch("/pins", {
          method: "POST",
          body: JSON.stringify({
            type: "nav",
            target_id: item.name,
            label: item.name,
            href: item.href,
            icon: item.name,
          }),
        });
        refetchPins();
        toast("Pinned to sidebar", {
          action: { label: "Undo", onClick: () => handleTogglePin(item, res) },
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Failed to toggle pin", error);
      toast.error("Failed to toggle pin");
    }
  }, [refetchPins]);

  // Close mobile menu on navigate
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);




  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useShortcuts();

  useEffect(() => {
    const handleToggle = () => cycleSidebarState();
    document.addEventListener("shortcut-toggle-sidebar", handleToggle);
    return () => document.removeEventListener("shortcut-toggle-sidebar", handleToggle);
  }, [cycleSidebarState]);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    clearAuth();
    queryClient.clear();
    window.location.href = "/login";
  };

  const isCollapsed = sidebarState === "collapsed";
  return (
    <AuthGuard>
      <ReverbProvider>
        <TooltipProvider>
        <HelpOverlay />
        <CommandPalette />
        <div className={cn(
          "grid h-screen w-full bg-app overflow-hidden transition-[grid-template-columns] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]",
          sidebarState === "expanded" ? "md:grid-cols-[264px_1fr]" : sidebarState === "collapsed" ? "md:grid-cols-[72px_1fr]" : "grid-cols-1"
        )}>
          {/* Desktop Sidebar */}
          <aside className={cn(
            "bg-surface border-r border-border relative z-20 h-full transition-[width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]",
            sidebarState === "hidden" ? "hidden" : "hidden md:flex flex-col"
          )}>
            <div className="flex items-center h-16 shrink-0 px-4 gap-3 border-b border-border">
              {isCollapsed ? (
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <div className="relative group w-8 h-8 flex items-center justify-center cursor-pointer ml-1" onClick={cycleSidebarState}>
                      <Image src="/icon.png" alt="Logo" width={32} height={32} className="rounded-md absolute inset-0 transition-opacity duration-[220ms] group-hover:opacity-0" priority />
                      <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-primary absolute opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Expand sidebar (Ctrl+B)</TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <button onClick={cycleSidebarState} className="text-neutral-500 hover:text-primary transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-sm" aria-label="Toggle sidebar">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">Collapse sidebar (Ctrl+B)</TooltipContent>
                  </Tooltip>
                  <Image src="/landscape-logo.png" alt="Workplace OS Logo" width={140} height={32} className="object-contain h-8 w-auto transition-opacity duration-[220ms]" priority />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 thin-scrollbar">
              {navGroups.map(group => (
                <NavGroup
                  key={group.label}
                  group={group}
                  userCapabilities={userCapabilities}
                  isCollapsed={isCollapsed}
                  isSheet={false}
                  pins={pins}
                  handleTogglePin={handleTogglePin}
                  getAccent={getAccent}
                />
              ))}
              
              {pins.length > 0 && (
                <div className="mt-4">
                  {!isCollapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase transition-opacity duration-[120ms]">Pinned</div>}
                  {isCollapsed && <div className="h-px bg-border mx-2 my-3 transition-opacity duration-[120ms]" />}
                  <div className="flex flex-col gap-1">
                    {pins.map((pin: any) => {
                      let navItem: any = null;
                      navGroups.forEach(g => {
                        const found = g.items.find((i: any) => i.name === pin.target_id);
                        if (found) navItem = found;
                      });
                      
                      if (navItem?.capability && !hasCapability(userCapabilities, navItem.capability)) {
                        return null;
                      }

                      const item = navItem || { name: pin.label, href: pin.href, icon: Star, capability: "" };
                      return (
                        <NavItem
                          key={item.name}
                          item={item}
                          isCollapsed={isCollapsed}
                          isSheet={false}
                          pins={pins}
                          handleTogglePin={handleTogglePin}
                          getAccent={getAccent}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto p-4 border-t border-border flex flex-col gap-2">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "justify-start text-xs text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40",
                      isCollapsed && "justify-center px-0"
                    )}
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                    {!isCollapsed && <span className="ml-2 font-medium whitespace-nowrap">Log out</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right" className="text-xs">Log out</TooltipContent>}
              </Tooltip>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-col min-w-0 h-full overflow-hidden">
            <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-surface/80 border-b border-border z-20 sticky top-0 backdrop-blur-md">
              <div className="flex items-center gap-2 md:gap-4">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Toggle Menu">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                    <SheetContent side="left" className="w-full sm:max-w-full h-full max-h-full p-0 flex flex-col bg-surface border-none transition-transform duration-[280ms] cubic-bezier(0.4,0,0.2,1)">
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation menu for the dashboard.</SheetDescription>
                      <div className="flex items-center justify-between h-16 shrink-0 px-6 border-b border-border bg-surface-2/40">
                        <div className="flex items-center gap-3">
                          <Image src="/icon.png" alt="Logo" width={28} height={28} className="rounded-md" priority />
                          <span className="font-display font-bold text-lg text-primary tracking-tight">
                            Workplace OS
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-1 thin-scrollbar">
                        {navGroups.map(group => (
                          <NavGroup
                            key={group.label}
                            group={group}
                            userCapabilities={userCapabilities}
                            isCollapsed={false}
                            isSheet={true}
                            pins={pins}
                            handleTogglePin={handleTogglePin}
                            getAccent={getAccent}
                          />
                        ))}
                        
                        {pins.length > 0 && (
                          <div className="mt-4">
                            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Pinned</div>
                            <div className="flex flex-col gap-1">
                              {pins.map((pin: any) => {
                                let navItem: any = null;
                                navGroups.forEach(g => {
                                  const found = g.items.find((i: any) => i.name === pin.target_id);
                                  if (found) navItem = found;
                                });

                                if (navItem?.capability && !hasCapability(userCapabilities, navItem.capability)) {
                                  return null;
                                }

                                const item = navItem || { name: pin.label, href: pin.href, icon: Star, capability: "" };
                                return (
                                  <NavItem
                                    key={item.name}
                                    item={item}
                                    isCollapsed={false}
                                    isSheet={true}
                                    pins={pins}
                                    handleTogglePin={handleTogglePin}
                                    getAccent={getAccent}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-auto p-4 border-t border-border">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span className="ml-2 font-medium">Log out</span>
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
              </div>

              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <TopbarTimer />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-9 w-9 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white shrink-0 focus-visible:ring-2 focus-visible:ring-violet-500"
                  title="Toggle theme"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                <NotificationsBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-violet-500" aria-label="User menu">
                      <Avatar size="md">
                        <AvatarFallback name={authUser?.name || "U"} />
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 text-xs">
                    <DropdownMenuLabel className="flex flex-col gap-1">
                      <span className="font-bold truncate text-sm">{authUser?.name}</span>
                      <span className="text-xs text-neutral-400 font-normal truncate">
                        {authUser?.email}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" prefetch={false} className="cursor-pointer gap-2">
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" prefetch={false} className="cursor-pointer gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Theme</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      System Theme
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Density</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setDensity("comfortable")} className="cursor-pointer gap-2">
                      <Rows3 className="w-4 h-4 text-muted-foreground" />
                      <span>Comfortable</span>
                      {density === "comfortable" && <Check className="w-3 h-3 ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDensity("compact")} className="cursor-pointer gap-2">
                      <Rows2 className="w-4 h-4 text-muted-foreground" />
                      <span>Compact</span>
                      {density === "compact" && <Check className="w-3 h-3 ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                        const event = new KeyboardEvent("keydown", { key: "/", ctrlKey: true });
                        document.dispatchEvent(event);
                      }} className="cursor-pointer gap-2">
                      <Command className="w-4 h-4 text-muted-foreground" />
                      Keyboard Shortcuts
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto relative z-10 bg-app p-4 pb-24 md:pb-6 md:p-6 lg:p-8">
              <div key={pathname} className="mx-auto max-w-[1440px] animate-page-in">
                <Breadcrumb />
                {children}
              </div>
            </main>

            {/* Mobile Bottom Navigation (Visible on <= 768px screens) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around z-40 px-2 pb-safe">
              <Link
                href="/dashboard"
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-0.5 text-[10px] font-medium transition-colors",
                  pathname === "/dashboard" ? "text-blue-600 dark:text-blue-400 font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/projects"
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-0.5 text-[10px] font-medium transition-colors",
                  pathname.startsWith("/dashboard/projects") ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                <FolderKanban className="w-5 h-5 shrink-0" />
                <span>Projects</span>
              </Link>

              <Link
                href="/dashboard/attendance"
                prefetch={false}
                title="My Attendance"
                className="flex flex-col items-center justify-center w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-emerald-600 text-white shadow-lg -mt-5 hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Clock className="w-6 h-6 shrink-0" />
              </Link>

              <Link
                href="/dashboard/chat"
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-0.5 text-[10px] font-medium transition-colors",
                  pathname.startsWith("/dashboard/chat") ? "text-pink-600 dark:text-pink-400 font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>Chat</span>
              </Link>

              <Link
                href="/dashboard/profile"
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-0.5 text-[10px] font-medium transition-colors",
                  pathname === "/dashboard/profile" ? "text-cyan-600 dark:text-cyan-400 font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                <UserCircle className="w-5 h-5 shrink-0" />
                <span>Profile</span>
              </Link>
            </nav>
          </div>
        </div>
      </TooltipProvider>
    </ReverbProvider>
  </AuthGuard>
  );
}
