"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useState, useEffect, useMemo } from "react";

const EMPTY_CAPABILITIES: string[] = [];
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppIcon } from "@g4k/ui/components";
import { SheetDescription, Button } from "@g4k/ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { useTheme } from "next-themes";
import { useTimerStore } from "@/stores/timer-store";
import { queryKeys } from "@/lib/query-keys";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useUIStore } from "@/lib/ui-store";

import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { Breadcrumb } from "@/components/app-shell/breadcrumb";
import { NotificationsBell } from "@/components/app-shell/notifications-bell";
import { ProjectTimerWidget } from "@/components/app-shell/project-timer-widget";
import { NavGroup } from "@/components/app-shell/nav-group";
import { PinnedItems } from "@/components/layout/pinned-items";
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
  { label: "Overview", items: [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Attendance & Time", href: "/dashboard/attendance", icon: "attendance", capability: "attendance.clock-self" },
    { name: "Projects & Tasks", href: "/dashboard/projects", icon: "projects", capability: "projects.view" },
    { name: "Communications", href: "/dashboard/chat", icon: "chat", capability: "chat.access" },
  ]},
  { label: "Organization", items: [
    { name: "Directory", href: "/dashboard/directory", icon: "directory", capability: "directory.view" },
    { name: "Attendance", href: "/dashboard/org/attendance", icon: "teamAttendance", capability: "hr.view-team-attendance" },
    { name: "Reports & Analytics", href: "/dashboard/reports", icon: "spreadsheet", capability: "reports.view" },
  ]},
  { label: "Account", items: [
    { name: "Settings & Profile", href: "/dashboard/profile", icon: "settings" },
  ]},
];

const accentClasses: Record<string, { bg: string; hoverBg: string; text: string; hoverText: string; bgDark: string; textDark: string; border: string; ring: string }> = {
  emerald: { bg: "bg-emerald-100", hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-950", text: "text-emerald-700", hoverText: "hover:text-emerald-700 dark:hover:text-emerald-300", bgDark: "dark:bg-emerald-950", textDark: "dark:text-emerald-300", border: "bg-emerald-600", ring: "ring-1 ring-inset ring-emerald-500/50" },
  amber: { bg: "bg-amber-100", hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-950", text: "text-amber-700", hoverText: "hover:text-amber-700 dark:hover:text-amber-300", bgDark: "dark:bg-amber-950", textDark: "dark:text-amber-300", border: "bg-amber-600", ring: "ring-1 ring-inset ring-amber-500/50" },
  pink: { bg: "bg-pink-100", hoverBg: "hover:bg-pink-100 dark:hover:bg-pink-950", text: "text-pink-700", hoverText: "hover:text-pink-700 dark:hover:text-pink-300", bgDark: "dark:bg-pink-950", textDark: "dark:text-pink-300", border: "bg-pink-600", ring: "ring-1 ring-inset ring-pink-500/50" },
  blue: { bg: "bg-blue-100", hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-950", text: "text-blue-700", hoverText: "hover:text-blue-700 dark:hover:text-blue-300", bgDark: "dark:bg-blue-950", textDark: "dark:text-blue-300", border: "bg-blue-600", ring: "ring-1 ring-inset ring-blue-500/50" },
  slate: { bg: "bg-slate-100", hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-900", text: "text-slate-700", hoverText: "hover:text-slate-700 dark:hover:text-slate-300", bgDark: "dark:bg-slate-900", textDark: "dark:text-slate-300", border: "bg-slate-600", ring: "ring-1 ring-inset ring-slate-500/50" },
  rose: { bg: "bg-rose-100", hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-950", text: "text-rose-700", hoverText: "hover:text-rose-700 dark:hover:text-rose-300", bgDark: "dark:bg-rose-950", textDark: "dark:text-rose-300", border: "bg-rose-600", ring: "ring-1 ring-inset ring-rose-500/50" },
  violet: { bg: "bg-primary-100", hoverBg: "hover:bg-primary-100 dark:hover:bg-primary-950", text: "text-primary-700", hoverText: "hover:text-primary-700 dark:hover:text-primary-300", bgDark: "dark:bg-primary-950", textDark: "dark:text-primary-300", border: "bg-primary-600", ring: "ring-1 ring-inset ring-primary-500/50" },
  indigo: { bg: "bg-indigo-100", hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-950", text: "text-indigo-700", hoverText: "hover:text-indigo-700 dark:hover:text-indigo-300", bgDark: "dark:bg-indigo-950", textDark: "dark:text-indigo-300", border: "bg-indigo-600", ring: "ring-1 ring-inset ring-indigo-500/50" },
  teal: { bg: "bg-teal-100", hoverBg: "hover:bg-teal-100 dark:hover:bg-teal-950", text: "text-teal-700", hoverText: "hover:text-teal-700 dark:hover:text-teal-300", bgDark: "dark:bg-teal-950", textDark: "dark:text-teal-300", border: "bg-teal-600", ring: "ring-1 ring-inset ring-teal-500/50" },
  cyan: { bg: "bg-cyan-100", hoverBg: "hover:bg-cyan-100 dark:hover:bg-cyan-950", text: "text-cyan-700", hoverText: "hover:text-cyan-700 dark:hover:text-cyan-300", bgDark: "dark:bg-cyan-950", textDark: "dark:text-cyan-300", border: "bg-cyan-600", ring: "ring-1 ring-inset ring-cyan-500/50" },
  orange: { bg: "bg-orange-100", hoverBg: "hover:bg-orange-100 dark:hover:bg-orange-950", text: "text-orange-700", hoverText: "hover:text-orange-700 dark:hover:text-orange-300", bgDark: "dark:bg-orange-950", textDark: "dark:text-orange-300", border: "bg-orange-600", ring: "ring-1 ring-inset ring-orange-500/50" },
  green: { bg: "bg-green-100", hoverBg: "hover:bg-green-100 dark:hover:bg-green-950", text: "text-green-700", hoverText: "hover:text-green-700 dark:hover:text-green-300", bgDark: "dark:bg-green-950", textDark: "dark:text-green-300", border: "bg-green-600", ring: "ring-1 ring-inset ring-green-500/50" },
};

function getAccent(href: string) {
  let color = "violet";
  if (href === "/dashboard") color = "blue";
  else if (href.startsWith("/dashboard/attendance")) color = "green";
  else if (href.startsWith("/dashboard/projects")) color = "indigo";
  else if (href.startsWith("/dashboard/chat")) color = "pink";
  else if (href.startsWith("/dashboard/directory")) color = "amber";
  else if (href.startsWith("/dashboard/org/users")) color = "cyan";
  else if (href.startsWith("/dashboard/org/attendance")) color = "teal";
  else if (href.startsWith("/dashboard/profile")) color = "rose";
  return accentClasses[color] || accentClasses.violet;
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
  const syncWithServer = useTimerStore((s) => s.syncWithServer);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: userCapabilities = EMPTY_CAPABILITIES, isError: isErrorCapabilities, refetch: refetchCapabilities } = useCapabilities();
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const density = useAuthStore((s) => s.density);
  const setDensity = useAuthStore((s) => s.setDensity);
  const { theme, setTheme } = useTheme();
  
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isErrorCapabilities) {
      const timer = setTimeout(() => setShowError(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [isErrorCapabilities]);

  const { data: initData } = useDashboardInit({
    staleTime: 5 * 60_000,
  });
  const preferencesData = useMemo(() => initData?.preferences ? { preferences: initData.preferences } : null, [initData]);

  useEffect(() => {
    if (initData?.attendance_today) {
      syncWithServer(initData.attendance_today.day, initData.attendance_today.events || [], initData.attendance_today.standard_seconds);
    }
  }, [initData, syncWithServer]);

  useEffect(() => {
    // Prefetch consolidated dashboard init data on cold load
    if (!authUser) return;
    queryClient.prefetchQuery({ queryKey: queryKeys.dashboardInit, queryFn: () => apiFetch("/dashboard/init").then(r => r.data), staleTime: 5 * 60_000 });
  }, [authUser, queryClient]);

  useEffect(() => {
    if (preferencesData?.preferences?.sidebar_state && !isInitialized) {
      setSidebarStateSilent(preferencesData.preferences.sidebar_state);
      useUIStore.setState({ isInitialized: true });
    }
  }, [preferencesData, setSidebarStateSilent, isInitialized]);

  // Pins removed

  // Close mobile menu on navigate
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [pathname]);






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

  if (isErrorCapabilities) {
    if (!showError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-app gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Verifying session...</h2>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-app gap-4">
        <AppIcon name="audit" size="hero" className=" text-rose-500" />
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Session could not load</h2>
          <p className="text-sm text-neutral-500">We couldn&apos;t verify your permissions.</p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Button variant="outline" onClick={() => refetchCapabilities()}>Retry</Button>
          <Button variant="ghost" onClick={handleLogout}>Log out</Button>
        </div>
      </div>
    );
  }

  return (
    <ReverbProvider>
      <AuthGuard>

        <TooltipProvider>
        <HelpOverlay />
        <CommandPalette />
        <div className={cn(
          "grid h-[100dvh] w-full bg-app overflow-hidden transition-[grid-template-columns] duration-300 ease-in-out",
          sidebarState === "expanded" ? "md:grid-cols-[240px_1fr]" : sidebarState === "collapsed" ? "md:grid-cols-[64px_1fr]" : "grid-cols-1"
        )}>
          {/* Desktop Sidebar */}
          <aside className={cn(
            "bg-surface border-r border-border relative h-full transition-[width,transform] duration-300 ease-in-out z-20 w-full",
            sidebarState === "hidden" ? "hidden" : "hidden md:flex flex-col"
          )}>
            <div className="flex items-center h-24 shrink-0 px-4 justify-center overflow-hidden py-4">
              {isCollapsed ? (
                <Image src="/icon.png" alt="Logo" width={56} height={56} className="rounded-[var(--radius)] shrink-0 transition-opacity duration-300" priority />
              ) : (
                <Image src="/landscape-logo.png" alt="Workplace OS Logo" width={200} height={60} className="object-contain w-full max-w-[200px] h-auto max-h-14 transition-opacity duration-300" priority />
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-2.5 flex flex-col gap-1 thin-scrollbar">
              {navGroups.map(group => (
                <NavGroup
                  key={group.label}
                  group={group}
                  userCapabilities={userCapabilities}
                  isCollapsed={isCollapsed}
                  isSheet={false}
                  getAccent={getAccent}
                />
              ))}
              <PinnedItems isCollapsed={isCollapsed} />
            </div>

            <div className="mt-auto p-4 border-t border-border flex flex-col gap-2">
              <Button
                variant="ghost"
                className={cn(
                  "text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                  isCollapsed ? "justify-center px-0" : "justify-start"
                )}
                onClick={cycleSidebarState}
              >
                {sidebarState === "collapsed" ? (
                  <AppIcon name="chevronRight" size="lg" className=" shrink-0" />
                ) : (
                  <>
                    <AppIcon name="chevronLeft" size="lg" className=" shrink-0" />
                    <span className="ml-2 font-medium whitespace-nowrap">Collapse</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start text-xs text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40",
                  isCollapsed && "justify-center px-0"
                )}
                onClick={handleLogout}
              >
                <AppIcon name="logout" className=" text-rose-600 shrink-0" />
                {!isCollapsed && <span className="ml-2 font-medium whitespace-nowrap">Log out</span>}
              </Button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
            <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-surface border-b border-border z-20">
              <div className="flex items-center gap-2 md:gap-4">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Toggle Menu">
                      <AppIcon name="menu" size="lg" />
                    </Button>
                  </SheetTrigger>
                    <SheetContent side="left" className="w-full sm:max-w-full h-full max-h-full p-0 flex flex-col bg-surface border-none transition-transform duration-[280ms] cubic-bezier(0.4,0,0.2,1)">
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation menu for the dashboard.</SheetDescription>
                      <div className="flex items-center justify-between h-16 shrink-0 px-6 border-b border-border bg-surface-2/40">
                        <div className="flex items-center gap-3">
                          <Image src="/icon.png" alt="Logo" width={28} height={28} className="rounded-[var(--radius)]" priority />
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
                            getAccent={getAccent}
                          />
                        ))}
                        <PinnedItems isCollapsed={false} />
                      </div>
                      <div className="mt-auto p-4 border-t border-border">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          onClick={handleLogout}
                        >
                          <AppIcon name="logout" className=" text-rose-600" />
                          <span className="ml-2 font-medium">Log out</span>
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
              </div>

              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <ProjectTimerWidget />
                <NotificationsBell />

                <DropdownMenu>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button className="outline-none shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-primary-500" aria-label="User menu">
                            <Avatar size="md">
                              <AvatarFallback name={authUser?.name || "U"} />
                            </Avatar>
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        User menu
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                        <AppIcon name="profile" className=" text-muted-foreground" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    {hasCapability(userCapabilities, "settings.manage") && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings" prefetch={false} className="cursor-pointer gap-2">
                          <AppIcon name="settings" className=" text-muted-foreground" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Theme</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer gap-2">
                      <AppIcon name="sun" className="text-muted-foreground" />
                      <span>Light</span>
                      {theme === "light" && <AppIcon name="check" size="xs" className="ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer gap-2">
                      <AppIcon name="moon" className="text-muted-foreground" />
                      <span>Dark</span>
                      {theme === "dark" && <AppIcon name="check" size="xs" className="ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2">
                      <AppIcon name="computer" className="text-muted-foreground" />
                      <span>System</span>
                      {theme === "system" && <AppIcon name="check" size="xs" className="ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Density</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setDensity("comfortable")} className="cursor-pointer gap-2">
                      <AppIcon name="density" className=" text-muted-foreground" />
                      <span>Comfortable</span>
                      {density === "comfortable" && <AppIcon name="check" size="xs" className=" ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDensity("compact")} className="cursor-pointer gap-2">
                      <AppIcon name="density" className=" text-muted-foreground" />
                      <span>Compact</span>
                      {density === "compact" && <AppIcon name="check" size="xs" className=" ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                        const event = new KeyboardEvent("keydown", { key: "/", ctrlKey: true });
                        document.dispatchEvent(event);
                      }} className="cursor-pointer gap-2">
                      <AppIcon name="command" className=" text-muted-foreground" />
                      Keyboard Shortcuts
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer gap-2"
                    >
                      <AppIcon name="logout" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main id="main-content" className="flex-1 overflow-y-auto relative z-10 bg-app p-4 pb-24 md:pb-6 md:p-6 lg:p-8">
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
                <AppIcon name="dashboard" size="lg" className=" shrink-0" />
                <span>Dashboard</span>
              </Link>

              {hasCapability(userCapabilities, "projects.view") && (
                <Link
                  href="/dashboard/projects"
                  prefetch={false}
                  className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 gap-0.5 text-[10px] font-medium transition-colors",
                    pathname.startsWith("/dashboard/projects") ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  )}
                >
                  <AppIcon name="projects" size="lg" className=" shrink-0" />
                  <span>Projects</span>
                </Link>
              )}

              {hasCapability(userCapabilities, "attendance.clock-self") && (
                <Link
                  href="/dashboard/attendance"
                  prefetch={false}
                  title="My Attendance"
                  className="flex flex-col items-center justify-center w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-emerald-600 text-white shadow-e3 -mt-5 hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <AppIcon name="teamAttendance" size="xl" className=" shrink-0" />
                </Link>
              )}

              <Link
                href="/dashboard/chat"
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-0.5 text-[10px] font-medium transition-colors",
                  pathname.startsWith("/dashboard/chat") ? "text-pink-600 dark:text-pink-400 font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                <AppIcon name="chat" size="lg" className=" shrink-0" />
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
                <AppIcon name="profile" size="lg" className=" shrink-0" />
                <span>Profile</span>
              </Link>
            </nav>
          </div>
        </div>
      </TooltipProvider>
      </AuthGuard>
    </ReverbProvider>
  );
}
