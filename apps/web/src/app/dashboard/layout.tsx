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

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat & Hub", href: "/dashboard/chat", icon: MessageSquare, capability: "directory.send-message" },
  { name: "Projects", href: "/dashboard/projects", icon: Folder, capability: "projects.manage" },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, capability: "tasks.submit" },
  { name: "Directory", href: "/dashboard/directory", icon: Users, capability: "directory.view" },
  { name: "Leave & Time Off", href: "/dashboard/leave", icon: CalendarDays, capability: "leave.request-self" },
  { name: "Employees", href: "/dashboard/org/users", icon: Users, capability: "users.employee.manage" },
  { name: "Team Attendance", href: "/dashboard/org/attendance", icon: Clock, capability: "hr.view-team-attendance" },
  { name: "Org Leave Approvals", href: "/dashboard/org/leave", icon: CalendarDays, capability: "leave.approve-employee" },
  { name: "Departments", href: "/dashboard/org/departments", icon: Building2, capability: "departments.manage" },
  { name: "Designations", href: "/dashboard/org/designations", icon: Briefcase, capability: "designations.manage" },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle, capability: "profile.edit" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, capability: "settings.manage" },
  { name: "Audit Log", href: "/dashboard/audit", icon: ShieldAlert, capability: "audit.view" },
];

const secondaryNav = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings, capability: "settings.manage" },
];

const accentClasses: Record<string, { bg: string; text: string; bgDark: string; textDark: string; border: string }> = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", bgDark: "dark:bg-emerald-950", textDark: "dark:text-emerald-300", border: "bg-emerald-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", bgDark: "dark:bg-amber-950", textDark: "dark:text-amber-300", border: "bg-amber-600" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", bgDark: "dark:bg-pink-950", textDark: "dark:text-pink-300", border: "bg-pink-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", bgDark: "dark:bg-blue-950", textDark: "dark:text-blue-300", border: "bg-blue-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", bgDark: "dark:bg-slate-900", textDark: "dark:text-slate-300", border: "bg-slate-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-700", bgDark: "dark:bg-rose-950", textDark: "dark:text-rose-300", border: "bg-rose-600" },
  violet: { bg: "bg-violet-100", text: "text-violet-700", bgDark: "dark:bg-violet-950", textDark: "dark:text-violet-300", border: "bg-violet-600" },
};

function getAccent(href: string) {
  let color = "violet";
  if (href.startsWith("/dashboard/attendance")) color = "emerald";
  else if (href.startsWith("/dashboard/leave")) color = "amber";
  else if (href.startsWith("/dashboard/directory")) color = "pink";
  else if (href.startsWith("/dashboard/org") || href.startsWith("/dashboard/profile")) color = "blue";
  else if (href.startsWith("/dashboard/settings")) color = "slate";
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
  const { user: authUser, clearAuth } = useAuthStore();
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

  const filteredPrimaryNav = primaryNav.filter(
    (item) => !item.capability || hasCapability(userCapabilities, item.capability)
  );

  const filteredSecondaryNav = secondaryNav.filter(
    (item) => !item.capability || hasCapability(userCapabilities, item.capability)
  );

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

  const renderNavItems = (items: typeof primaryNav, isSheet = false) => {
    return items.map((item) => {
      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
      const accent = getAccent(item.href);
      const currentlyCollapsed = !isSheet && isCollapsed;
      
      const existingPin = pins.find((p: any) => p.target_id === item.name);
      const isPinned = !!existingPin;
      
      const content = (
        <div key={item.name} className="relative group/nav flex items-center">
          <Link
            href={item.href}
            className={cn(
              "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative overflow-hidden text-xs",
              isActive
                ? `${accent.bg} ${accent.bgDark} ${accent.text} ${accent.textDark} font-bold shadow-sm`
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white",
              currentlyCollapsed && "justify-center px-0"
            )}
          >
            {isActive && (
              <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-md", accent.border)} />
            )}
            <item.icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? `${accent.text} ${accent.textDark}` : "text-neutral-400 group-hover/nav:text-neutral-700 dark:group-hover/nav:text-neutral-200"
              )}
            />
            {!currentlyCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
          </Link>
          {!currentlyCollapsed && (
            <button 
              onClick={(e) => { e.preventDefault(); handleTogglePin(item, existingPin); }}
              className={cn(
                "absolute right-2 p-1.5 rounded-md transition-opacity",
                isPinned ? "opacity-100 text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40" : "opacity-0 group-hover/nav:opacity-100 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              )}
            >
              <Star className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />
            </button>
          )}
        </div>
      );

      if (currentlyCollapsed) {
        return (
          <Tooltip key={item.name} delayDuration={150}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
          </Tooltip>
        );
      }
      return content;
    });
  };

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
          <aside className="hidden md:flex flex-col bg-surface border-r border-border relative z-20 overflow-hidden h-full">
            <div className="flex items-center h-16 shrink-0 px-4 gap-3 border-b border-border">
              <Image src="/icon.png" alt="Logo" width={28} height={28} className="rounded-md shrink-0" priority />
              {!isCollapsed && (
                <span className="font-display font-bold text-lg text-primary tracking-tight whitespace-nowrap">
                  Workplace OS
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 thin-scrollbar">
              {renderNavItems(filteredPrimaryNav)}
              {filteredSecondaryNav.length > 0 && <div className="my-4 h-px bg-border mx-2" />}
              {renderNavItems(filteredSecondaryNav)}
              
              {pins.length > 0 && (
                <>
                  <div className="my-4 h-px bg-border mx-2" />
                  {!isCollapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Pinned</div>}
                  {pins.map((pin: any) => {
                    // Match back to primaryNav to get the icon
                    const navItem = primaryNav.find(n => n.name === pin.target_id) || secondaryNav.find(n => n.name === pin.target_id);
                    const IconComp = navItem ? navItem.icon : Star;
                    return renderNavItems([{ name: pin.label, href: pin.href, icon: IconComp, capability: "" }])[0];
                  })}
                </>
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
                className="hidden md:flex ml-auto self-end text-muted hover:text-primary absolute -right-4 top-20 bg-surface border border-border shadow-e1 rounded-full w-8 h-8 z-30 transition-transform active:scale-95"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-col min-w-0 h-full overflow-hidden">
            <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-surface/80 border-b border-border z-20 sticky top-0 backdrop-blur-md">
              <div className="flex items-center gap-2 md:gap-4">
                {(isHidden || typeof window !== 'undefined' && window.innerWidth < 768) && (
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    {isHidden && (
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
                      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
                        {renderNavItems(filteredPrimaryNav, true)}
                        {filteredSecondaryNav.length > 0 && <div className="my-4 h-px bg-border mx-2" />}
                        {renderNavItems(filteredSecondaryNav, true)}
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
                )}

                <button
                  onClick={() => {
                    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
                    document.dispatchEvent(event);
                  }}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-input bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors w-40 sm:w-64"
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">Search...</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 rounded shrink-0">
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
                        <UserCircle className="w-4 h-4 text-violet-600" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer gap-2">
                        <Settings className="w-4 h-4 text-violet-600" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                        const event = new KeyboardEvent("keydown", { key: "/", ctrlKey: true });
                        document.dispatchEvent(event);
                      }} className="cursor-pointer gap-2">
                      <Search className="w-4 h-4 text-violet-600" />
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
                  pathname === "/dashboard" ? "text-violet-600" : "text-neutral-500"
                )}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/directory"
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-1 text-[10px] font-medium transition-colors",
                  pathname === "/dashboard/directory" ? "text-violet-600" : "text-neutral-500"
                )}
              >
                <Users className="w-5 h-5" />
                <span>Directory</span>
              </Link>

              <Link
                href="/dashboard/org/attendance"
                className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-violet-600 text-white shadow-lg -mt-5 hover:bg-violet-700 transition-transform active:scale-95"
              >
                <Clock className="w-6 h-6" />
              </Link>

              <Link
                href="/dashboard/org/users"
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-1 text-[10px] font-medium transition-colors",
                  pathname.startsWith("/dashboard/org") ? "text-violet-600" : "text-neutral-500"
                )}
              >
                <Building2 className="w-5 h-5" />
                <span>Org</span>
              </Link>

              <Link
                href="/dashboard/profile"
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 gap-1 text-[10px] font-medium transition-colors",
                  pathname === "/dashboard/profile" ? "text-violet-600" : "text-neutral-500"
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
