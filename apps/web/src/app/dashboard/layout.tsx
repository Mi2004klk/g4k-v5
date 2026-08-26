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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { useAttendanceToday } from "@/hooks/use-attendance-today";
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
import { ShellPolish } from "@/components/app-shell/shell-polish";
import { PinnedItems } from "@/components/layout/pinned-items";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ReverbProvider } from "@/hooks/use-reverb";
import { ErrorBoundary } from "@g4k/ui/components";
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
    { name: "Attendance & Time", href: "/dashboard/attendance", icon: "attendance", hideForAdmin: true },
    { name: "Projects & Tasks", href: "/dashboard/projects", icon: "projects", capability: "projects.view" },
    { name: "Communications", href: "/dashboard/chat", icon: "chat", capability: "chat.access" },
  ]},
  { label: "Organization", items: [
    { name: "Directory", href: "/dashboard/directory", icon: "directory", capability: "directory.view" },
    { name: "Attendance", href: "/dashboard/org/attendance", icon: "teamAttendance", capability: "hr.view-team-attendance" },
    { name: "Reports & Analytics", href: "/dashboard/reports", icon: "spreadsheet", capability: "reports.view" },
  ]},
  { label: "Account", items: [
    { name: "My Profile", href: "/dashboard/profile", icon: "userCircle" },
    { name: "Audit Logs", href: "/dashboard/audit", icon: "audit", capability: "audit.view" },
    { name: "System Settings", href: "/dashboard/settings", icon: "settings", capability: "settings.manage" },
  ]},
];

import { navAccent } from "@g4k/ui/theme";

function getAccent(href: string) {
  let color = "violet";
  if (href === "/dashboard") color = "blue";
  else if (href.startsWith("/dashboard/attendance")) color = "green";
  else if (href.startsWith("/dashboard/projects")) color = "indigo";
  else if (href.startsWith("/dashboard/chat")) color = "pink";
  else if (href.startsWith("/dashboard/directory")) color = "amber";
  else if (href.startsWith("/dashboard/org/attendance")) color = "teal";
  else if (href.startsWith("/dashboard/profile")) color = "rose";
  return navAccent(color);
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
  const { data: userCapabilities = EMPTY_CAPABILITIES, isError: isErrorCapabilities, error: errorCapabilities, refetch: refetchCapabilities } = useCapabilities();
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const density = useAuthStore((s) => s.density);
  const setDensity = useAuthStore((s) => s.setDensity);
  const { theme, setTheme } = useTheme();
  
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { data: chatUnreadData } = useQuery({
    queryKey: queryKeys.chatUnreadCount,
    queryFn: () => apiFetch("/chat/unread-count"),
    refetchInterval: 30000,
    enabled: !!authUser,
  });
  const chatUnreadCount = chatUnreadData?.count || 0;

  const dynamicNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      badge: item.href === "/dashboard/chat" ? chatUnreadCount : undefined
    }))
  }));

  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isErrorCapabilities) {
      const err = errorCapabilities as any;
      if (err && (err.status === 401 || err.status === 403)) {
        handleLogout();
        return;
      }
      const timer = setTimeout(() => setShowError(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [isErrorCapabilities, errorCapabilities]);

  const { data: initData } = useDashboardInit({
    staleTime: 5 * 60_000,
  });
  const preferencesData = useMemo(() => initData?.preferences ? { preferences: initData.preferences } : null, [initData]);

  const { data: attendanceData } = useAttendanceToday();

  useEffect(() => {
    if (attendanceData) {
      syncWithServer(attendanceData.day, attendanceData.events || [], attendanceData.standard_seconds);
    }
  }, [attendanceData, syncWithServer]);



  useEffect(() => {
    if (preferencesData?.preferences?.sidebar_state && !isInitialized) {
      setSidebarStateSilent(preferencesData.preferences.sidebar_state);
      useUIStore.setState({ isInitialized: true });
    }
  }, [preferencesData, setSidebarStateSilent, isInitialized]);

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

  if (!isHydrated) {
    return null; // Hydration gate to prevent Zustand persist mismatch
  }

  if (isErrorCapabilities) {
    if (!showError) {
      return (
        <AuthGuard>
          <div className="flex h-screen w-full flex-col items-center justify-center bg-app gap-4">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Verifying session...</h2>
            </div>
          </div>
        </AuthGuard>
      );
    }

    return (
      <AuthGuard>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-app gap-4">
          <AppIcon name="audit" size="hero" className=" text-rose-500" />
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Session could not load</h2>
            <p className="text-sm text-neutral-500">We couldn&apos;t verify your permissions.</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button variant="outline" onClick={() => {
              useAuthStore.getState().clearAuth();
              window.location.href = "/login";
            }}>Log in again</Button>
            <Button variant="ghost" onClick={handleLogout}>Log out</Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
      <ReverbProvider>
        <AuthGuard>
          <ShellPolish />
          <TooltipProvider>
        <HelpOverlay />
        <CommandPalette />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground">
          Skip to main content
        </a>
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
              {dynamicNavGroups.map(group => (
                <NavGroup
                  key={group.label}
                  group={group}
                  userCapabilities={userCapabilities}
                  authUser={authUser}
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
                        {dynamicNavGroups.map(group => (
                          <NavGroup
                            key={group.label}
                            group={group}
                            userCapabilities={userCapabilities}
                            authUser={authUser}
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
                  <DropdownMenuContent align="end" className="w-64 p-0 shadow-xl border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/50">
                      <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{authUser?.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 truncate">{authUser?.email}</div>
                    </div>
                    
                    <div className="p-1.5">
                      <DropdownMenuItem asChild className="h-9 px-3 gap-3 rounded-lg cursor-pointer">
                        <Link href="/dashboard/profile" prefetch={false}>
                          <AppIcon name="profile" className="text-neutral-500" size="sm" />
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">My Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      {hasCapability(userCapabilities, "settings.manage") && (
                        <DropdownMenuItem asChild className="h-9 px-3 gap-3 rounded-lg cursor-pointer">
                          <Link href="/dashboard/settings" prefetch={false}>
                            <AppIcon name="settings" className="text-neutral-500" size="sm" />
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">Settings</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </div>
                    
                    <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800/60 m-0" />
                    
                    <div className="p-1.5">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 tracking-widest uppercase">Theme</div>
                      <DropdownMenuItem onClick={() => setTheme("light")} className="h-9 px-3 gap-3 rounded-lg cursor-pointer relative">
                        <AppIcon name="sun" className="text-neutral-500" size="sm" />
                        <span className="text-neutral-700 dark:text-neutral-300">Light</span>
                        {theme === "light" && <AppIcon name="check" size="xs" className="absolute right-3 text-primary-500" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")} className="h-9 px-3 gap-3 rounded-lg cursor-pointer relative">
                        <AppIcon name="moon" className="text-neutral-500" size="sm" />
                        <span className="text-neutral-700 dark:text-neutral-300">Dark</span>
                        {theme === "dark" && <AppIcon name="check" size="xs" className="absolute right-3 text-primary-500" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")} className="h-9 px-3 gap-3 rounded-lg cursor-pointer relative">
                        <AppIcon name="computer" className="text-neutral-500" size="sm" />
                        <span className="text-neutral-700 dark:text-neutral-300">System</span>
                        {theme === "system" && <AppIcon name="check" size="xs" className="absolute right-3 text-primary-500" />}
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800/60 m-0" />

                    <div className="p-1.5">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 tracking-widest uppercase">Density</div>
                      <DropdownMenuItem onClick={() => setDensity("comfortable")} className="h-9 px-3 gap-3 rounded-lg cursor-pointer relative">
                        <AppIcon name="list" className="text-neutral-500" size="sm" />
                        <span className="text-neutral-700 dark:text-neutral-300">Comfortable</span>
                        {density === "comfortable" && <AppIcon name="check" size="xs" className="absolute right-3 text-primary-500" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDensity("compact")} className="h-9 px-3 gap-3 rounded-lg cursor-pointer relative">
                        <AppIcon name="density" className="text-neutral-500" size="sm" />
                        <span className="text-neutral-700 dark:text-neutral-300">Compact</span>
                        {density === "compact" && <AppIcon name="check" size="xs" className="absolute right-3 text-primary-500" />}
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800/60 m-0" />

                    <div className="p-1.5">
                      <DropdownMenuItem onClick={() => {
                          const event = new KeyboardEvent("keydown", { key: "/", ctrlKey: true });
                          document.dispatchEvent(event);
                        }} className="h-9 px-3 gap-3 rounded-lg cursor-pointer">
                        <AppIcon name="command" className="text-neutral-500" size="sm" />
                        <span className="text-neutral-700 dark:text-neutral-300">Keyboard Shortcuts</span>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800/60 m-0" />

                    <div className="p-1.5">
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="h-9 px-3 gap-3 rounded-lg cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/40 group"
                      >
                        <AppIcon name="logout" size="sm" className="text-rose-500 group-focus:text-rose-600 transition-colors" />
                        <span className="font-medium">Log out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main id="main-content" className="flex-1 overflow-y-auto relative z-10 bg-app p-0 md:p-6 lg:p-8">
              <PullToRefresh>
                <div key={pathname} className="mx-auto max-w-[1440px] animate-page-in p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-0">
                  <ErrorBoundary resetKeys={[pathname]}>
                    <Breadcrumb />
                    {children}
                  </ErrorBoundary>
                </div>
              </PullToRefresh>
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

              {(hasCapability(userCapabilities, "attendance.clock-self") || hasCapability(userCapabilities, "leave.request-self")) && (
                <Link
                  href="/dashboard/attendance"
                  prefetch={false}
                  title="My Attendance"
                  className="flex flex-col items-center justify-center w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-emerald-600 text-white shadow-e3 -mt-5 hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <AppIcon name="teamAttendance" size="xl" className=" shrink-0" />
                </Link>
              )}

              {hasCapability(userCapabilities, "chat.access") && (
                <Link
                  href="/dashboard/chat"
                  prefetch={false}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-12 h-12 gap-0.5 text-[10px] font-medium transition-colors",
                    pathname.startsWith("/dashboard/chat") ? "text-pink-600 dark:text-pink-400 font-bold" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  )}
                >
                  <AppIcon name="chat" size="lg" className=" shrink-0" />
                  <span>Chat</span>
                  {chatUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-neutral-900">
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </span>
                  )}
                </Link>
              )}

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
