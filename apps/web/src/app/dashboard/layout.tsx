"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Users, User, Bell, Settings, 
  Menu, Search, X, LogOut, Sun, Moon, Map
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Stub fetch for user data to drive role-based nav
    fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(console.error);
  }, [router]);

  const activeRole = user?.active_role || user?.user?.roles?.[0] || 'employee';
  
    // Navigation mapping based on roles
    const navItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'hr', 'employee'] },
      { name: "Directory", href: "/dashboard/directory", icon: Users, roles: ['super_admin', 'hr', 'employee'] },
      { name: "Chat", href: "/dashboard/chat", icon: User, roles: ['super_admin', 'hr', 'employee'] },
      { name: "Announcements", href: "/dashboard/announcements", icon: Bell, roles: ['super_admin', 'hr', 'employee'] },
      { name: "Reports", href: "/dashboard/reports", icon: LayoutDashboard, roles: ['super_admin', 'hr'] },
      { name: "Org Map", href: "/dashboard/org/departments", icon: Map, roles: ['super_admin', 'hr'] },
      { name: "Employees", href: "/dashboard/org/users", icon: Users, roles: ['super_admin', 'hr'] },
      { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ['super_admin', 'hr'] },
      { name: "Audit Logs", href: "/dashboard/audit", icon: LayoutDashboard, roles: ['super_admin', 'hr'] },
      { name: "My Profile", href: "/dashboard/profile", icon: User, roles: ['super_admin', 'hr', 'employee'] },
    ].filter(item => item.roles.includes(activeRole));

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!mounted) return null; // Avoid hydration mismatch on theme toggle

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            G4K Workplace
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                }`}>
                  <item.icon className={`mr-3 w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
        
        {/* Pinned Items Stub */}
        <div className="px-6 py-4 border-t border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Pinned</p>
          <div className="text-sm text-zinc-600 italic">No pinned items</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur z-10 sticky top-0">
          
          <div className="flex items-center flex-1">
            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Search Stub (Cmd+K) */}
            <Button variant="outline" className="hidden md:flex items-center text-zinc-400 bg-zinc-900 border-zinc-800 w-64 justify-start" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}))}>
              <Search className="w-4 h-4 mr-2" />
              Search...
              <span className="ml-auto text-xs border border-zinc-700 rounded px-1.5 py-0.5">Ctrl K</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.user?.name?.charAt(0) || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.user?.email}
                    </p>
                    <p className="text-xs mt-1 text-indigo-400 font-semibold uppercase">{activeRole}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/sessions")}>
                  Device Sessions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-950">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-3/4 max-w-sm bg-zinc-900 h-full border-r border-zinc-800 flex flex-col animate-in slide-in-from-left">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                G4K Workplace
              </span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <span className={`flex items-center px-4 py-3 rounded-lg text-base font-medium ${
                      isActive 
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                        : "text-zinc-400 active:bg-zinc-800"
                    }`}>
                      <item.icon className={`mr-4 w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
