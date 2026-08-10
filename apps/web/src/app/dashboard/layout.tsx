"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Search,
  Sun,
  Moon,
  CalendarDays,
  Folder,
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
import { Button } from "@g4k/ui/components";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { useTheme } from "next-themes";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useUIStore } from "@/lib/ui-store";

import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { Breadcrumb } from "@/components/app-shell/breadcrumb";
import { NotificationsBell } from "@/components/app-shell/notifications-bell";
import { TopbarTimer } from "@/components/app-shell/topbar-timer";
import { NavGroup, NavItem } from "@/components/app-shell/nav-group";
import { HelpOverlay, Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
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
  { label: "Workspace", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Chat & Hub", href: "/dashboard/chat", icon: MessageSquare, capability: "directory.send-message" },
  ]},
  { label: "My Work", items: [
    { name: "Attendance", href: "/dashboard/attendance", icon: Clock },
    { name: "Leave & Time Off", href: "/dashboard/leave", icon: CalendarDays, capability: "leave.request-self" },
    { name: "Projects", href: "/dashboard/projects", icon: Folder, capability: "projects.manage" },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, capability: "tasks.submit" },
  ]},
  { label: "People", items: [
    { name: "Directory", href: "/dashboard/directory", icon: Users, capability: "directory.view" },
  ]},
  { label: "Administration", items: [
    { name: "Employees", href: "/dashboard/org/users", icon: Users, capability: "users.employee.manage" },
    { name: "Team Attendance", href: "/dashboard/org/attendance", icon: Clock, capability: "hr.view-team-attendance" },
    { name: "Org Leave Approvals", href: "/dashboard/org/leave", icon: CalendarDays, capability: "leave.approve-employee" },
    { name: "Departments", href: "/dashboard/org/departments", icon: Building2, capability: "departments.manage" },
    { name: "Designations", href: "/dashboard/org/designations", icon: Briefcase, capability: "designations.manage" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, capability: "settings.manage" },
    { name: "Audit Log", href: "/dashboard/audit", icon: ShieldAlert, capability: "audit.view" },
  ]},
  { label: "Account", items: [
    { name: "Profile", href: "/dashboard/profile", icon: UserCircle, capability: "profile.edit" },
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
  else if (href.startsWith("/dashboard/chat")) color = "violet";
  else if (href.startsWith("/dashboard/projects")) color = "orange";
  else if (href.startsWith("/dashboard/tasks")) color = "green";
  else if (href.startsWith("/dashboard/attendance")) color = "emerald";
  else if (href.startsWith("/dashboard/leave")) color = "amber";
  else if (href.startsWith("/dashboard/directory")) color = "pink";
  else if (href.startsWith("/dashboard/org/users")) color = "indigo";
  else if (href.startsWith("/dashboard/org/attendance")) color = "emerald";
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
  const { sidebarState, cycleSidebarState, initPreferences } = useUIStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: userCapabilities = [] } = useCapabilities();
  const { user: authUser, clearAuth, density, setDensity } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const { data: pins = [], refetch: refetchPins } = useQuery({
    queryKey: ["pins"],
    queryFn: () => apiFetch("/pins"),
  });

  const handleTogglePin = async (item: any, existingPin: any) => {
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
  };

  // Close mobile menu on navigate
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);


  useEffect(() => {
    initPreferences();
  }, [initPreferences]);

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
  const isHidden = sidebarState === "hidden";
  return (
    <AuthGuard>
      <TooltipProvider>
        <HelpOverlay />
        <CommandPalette />
        <div className={cn(
          "grid h-screen w-full bg-app overflow-hidden transition-[grid-template-columns] duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
          sidebarState === "expanded" ? "md:grid-cols-[264px_1fr]" : sidebarState === "collapsed" ? "md:grid-cols-[72px_1fr]" : "grid-cols-1"
        )}>
          {/* Desktop Sidebar */}
          <aside className={cn(
            "bg-surface border-r border-border relative z-20 overflow-hidden h-full transition-[width] duration-200 ease-[cubic-bezier(.4,0,.2,1)]",
            sidebarState === "hidden" ? "hidden" : "hidden md:flex flex-col"
          )}>
            <div className="flex items-center h-16 shrink-0 px-4 gap-3 border-b border-border">
              <Image src="/icon.png" alt="Logo" width={isCollapsed ? 28 : 32} height={isCollapsed ? 28 : 32} className="rounded-md shrink-0 transition-all duration-200" priority />
              {!isCollapsed && (
                <span className="font-display font-bold text-lg text-primary tracking-tight whitespace-nowrap transition-opacity duration-200">
                  Workplace OS
                </span>
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
                  {!isCollapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-muted uppercase transition-opacity duration-200">Pinned</div>}
                  {isCollapsed && <div className="h-px bg-border mx-2 my-3 transition-opacity duration-200" />}
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
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    {!isCollapsed && <span className="ml-2 font-medium whitespace-nowrap">Log out</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right" className="text-xs">Log out</TooltipContent>}
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                onClick={cycleSidebarState}
                className="hidden md:flex ml-auto self-end text-muted hover:text-primary absolute -right-[18px] top-20 bg-surface border border-border shadow-e1 rounded-full w-9 h-9 z-30 transition-transform active:scale-95"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-col min-w-0 h-full overflow-hidden">
            <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-surface/80 border-b border-border z-20 sticky top-0 backdrop-blur-md">
              <div className="flex items-center gap-2 md:gap-4">
                {sidebarState === "hidden" && (
                  <div className="hidden md:flex items-center gap-2 shrink-0 mr-4">
                    <Image src="/icon.png" alt="Logo" width={24} height={24} className="rounded-md" priority />
                    <span className="font-display font-bold text-sm text-primary tracking-tight hidden lg:inline">Workplace OS</span>
                  </div>
                )}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  {sidebarState === "hidden" && (
                    <Button variant="ghost" size="icon" className="hidden md:flex shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
                      <Menu className="w-5 h-5" />
                    </Button>
                  )}
                    <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-surface border-border">
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <div className="flex items-center h-16 shrink-0 px-6 gap-3 border-b border-border">
                        <Image src="/icon.png" alt="Logo" width={28} height={28} className="rounded-md" priority />
                        <span className="font-display font-bold text-lg text-primary tracking-tight">
                          Workplace OS
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 thin-scrollbar">
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
                            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-muted uppercase">Pinned</div>
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
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span className="ml-2 font-medium">Log out</span>
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                <button
                  onClick={() => {
                    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
                    document.dispatchEvent(event);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-input bg-surface-2 text-xs text-muted hover:text-secondary transition-colors w-40 sm:w-64"
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">Search...</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-surface-2 rounded shrink-0">
                    Ctrl+K
                  </kbd>
                </button>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <TopbarTimer />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-9 w-9 text-neutral-500 hover:text-neutral-900 dark:hover:text-white shrink-0"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                <NotificationsBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-violet-500">
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
                      <Link href="/dashboard/profile" className="cursor-pointer gap-2">
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer gap-2">
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
              <div className="mx-auto max-w-[1440px]">
                <Breadcrumb />
                {children}
              </div>
            </main>

            {/* Mobile Bottom Navigation (Visible on <= 768px screens) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around z-40 px-2 pb-safe">
              <Link
                href="/dashboard"
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-1 text-[10px] font-medium transition-colors",
                  pathname === "/dashboard" ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/directory"
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-1 text-[10px] font-medium transition-colors",
                  pathname === "/dashboard/directory" ? "text-pink-600 dark:text-pink-400" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <Users className="w-5 h-5" />
                <span>Directory</span>
              </Link>

              <Link
                href="/dashboard/attendance"
                className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg -mt-5 hover:bg-emerald-700 transition-transform active:scale-95"
              >
                <Clock className="w-6 h-6" />
              </Link>

              <Link
                href="/dashboard/leave"
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-1 text-[10px] font-medium transition-colors",
                  pathname.startsWith("/dashboard/leave") ? "text-amber-600 dark:text-amber-400" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <CalendarDays className="w-5 h-5" />
                <span>Leave</span>
              </Link>

              <Link
                href="/dashboard/profile"
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-1 text-[10px] font-medium transition-colors",
                  pathname === "/dashboard/profile" ? "text-cyan-600 dark:text-cyan-400" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <UserCircle className="w-5 h-5" />
                <span>Profile</span>
              </Link>
            </nav>
          </div>
        </div>
      </TooltipProvider>
    </AuthGuard>
  );
}
