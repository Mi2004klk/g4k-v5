"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useState, useEffect } from "react";
import Link from "next/link";
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
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { useTheme } from "next-themes";

import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { Breadcrumb } from "@/components/app-shell/breadcrumb";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { NotificationsBell } from "@/components/app-shell/notifications-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, capability: "app-shell" },
  { name: "Chat & Hub", href: "/dashboard/chat", icon: MessageSquare, capability: "communication" },
  { name: "Reports & Exports", href: "/dashboard/reports", icon: FileText, capability: "reporting" },
  { name: "Projects", href: "/dashboard/projects", icon: Folder, capability: "projects.manage" },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, capability: "tasks.submit" },
  { name: "Directory", href: "/dashboard/directory", icon: Users, capability: "directory.view" },
  { name: "Leave & Time Off", href: "/dashboard/leave", icon: CalendarDays, capability: "employee.leave.request-self" },
  { name: "Employees", href: "/dashboard/org/users", icon: Users, capability: "users.view" },
  { name: "Org Leave Approvals", href: "/dashboard/org/leave", icon: CalendarDays, capability: "hr.leave.approve-employee" },
  { name: "Departments", href: "/dashboard/org/departments", icon: Building2, capability: "departments.view" },
  { name: "Designations", href: "/dashboard/org/designations", icon: Briefcase, capability: "designations.view" },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle, capability: "profile.edit" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, capability: "settings.manage" },
  { name: "Audit Log", href: "/dashboard/audit", icon: ShieldAlert, capability: "audit.view" },
];

const secondaryNav = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings, capability: "admin.settings.manage" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: userCapabilities = [] } = useCapabilities();
  const { user: authUser, clearAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // Register PWA Service Worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore service worker registration errors
      });
    }
  }, []);

  // Keyboard shortcut for sidebar toggle (Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredPrimaryNav = primaryNav.filter(
    (item) => !item.capability || hasCapability(userCapabilities, item.capability)
  );

  const filteredSecondaryNav = secondaryNav.filter(
    (item) => !item.capability || hasCapability(userCapabilities, item.capability)
  );

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore API logout errors
    }
    clearAuth();
    queryClient.clear();
    window.location.href = "/login";
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-app overflow-hidden">
        <OfflineBanner />
        <CommandPalette />

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col bg-surface border-r border-border transition-all duration-220 ease-[cubic-bezier(.4,0,.2,1)] relative z-20",
            isCollapsed ? "w-[72px]" : "w-[264px]"
          )}
        >
          {/* Logo & Brand Header */}
          <div className="flex items-center h-16 shrink-0 px-4 gap-3 border-b border-border">
            <img src="/icon.png" alt="Logo" className="w-7 h-7 rounded-md" />
            {!isCollapsed && (
              <span className="font-display font-bold text-lg text-primary tracking-tight whitespace-nowrap">
                Workplace OS
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 thin-scrollbar">
            {filteredPrimaryNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all relative overflow-hidden text-xs",
                    isActive
                      ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-violet-600 rounded-r-md" />
                  )}
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-violet-600 dark:text-violet-400" : "text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                    )}
                  />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </Link>
              );
            })}

            {filteredSecondaryNav.length > 0 && <div className="my-4 h-px bg-border mx-2" />}

            {filteredSecondaryNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg group transition-all relative text-xs",
                    isActive
                      ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-violet-600 rounded-r-md" />
                  )}
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-violet-600 dark:text-violet-400" : "text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                    )}
                  />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Pinned Items & Sidebar Collapse Toggle */}
          <div className="mt-auto p-4 border-t border-border flex flex-col gap-2">
            <Button
              variant="ghost"
              className={cn(
                "justify-start text-xs text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40",
                isCollapsed && "justify-center px-0"
              )}
              onClick={handleLogout}
              title={isCollapsed ? "Log out" : undefined}
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              {!isCollapsed && <span className="ml-2 font-medium">Log out</span>}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex ml-auto self-end text-muted hover:text-primary absolute -right-4 top-20 bg-surface border border-border shadow-e1 rounded-full w-8 h-8 z-30"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* TopBar Header */}
          <header className="flex items-center justify-between h-16 px-6 bg-surface border-b border-border z-20 sticky top-0 backdrop-blur-md">
            {/* Left: Global Search trigger stub */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
                  document.dispatchEvent(event);
                }}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-input bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors w-48 sm:w-64"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="flex-1 text-left truncate">Search workspace...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 rounded">
                  Ctrl+K
                </kbd>
              </button>
            </div>

            {/* Right TopBar Actions: Theme toggle, Notifications, User Avatar */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <NotificationsBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow">
                      {authUser?.name?.charAt(0) || "U"}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-xs">
                  <DropdownMenuLabel>
                    <div className="font-bold truncate">{authUser?.name}</div>
                    <div className="text-[10px] text-neutral-400 font-normal truncate">
                      {authUser?.email}
                    </div>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-rose-600 focus:text-rose-700 cursor-pointer gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto relative z-10 bg-app p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1440px]">
              <Breadcrumb />
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation (Visible on <= 768px screens) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around z-40 px-2">
            <Link
              href="/dashboard"
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
                pathname === "/dashboard" ? "text-violet-600" : "text-neutral-500"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/dashboard/directory"
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
                pathname === "/dashboard/directory" ? "text-violet-600" : "text-neutral-500"
              )}
            >
              <Users className="w-5 h-5" />
              <span>Directory</span>
            </Link>

            {/* Prominent Attendance Action Button */}
            <Link
              href="/dashboard/org/attendance"
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-violet-600 text-white shadow-lg -mt-5 hover:bg-violet-700 transition-transform active:scale-95"
            >
              <Clock className="w-6 h-6" />
            </Link>

            <Link
              href="/dashboard/org/users"
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
                pathname.startsWith("/dashboard/org") ? "text-violet-600" : "text-neutral-500"
              )}
            >
              <Building2 className="w-5 h-5" />
              <span>Org</span>
            </Link>

            <Link
              href="/dashboard/profile"
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
                pathname === "/dashboard/profile" ? "text-violet-600" : "text-neutral-500"
              )}
            >
              <UserCircle className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          </nav>
        </div>
      </div>
    </AuthGuard>
  );
}
