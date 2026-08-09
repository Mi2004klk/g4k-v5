"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Clock, CalendarDays, MessageSquare } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Attendance", href: "/dashboard/attendance", icon: Clock },
    { name: "Leave", href: "/dashboard/leave", icon: CalendarDays },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around z-50 px-2 safe-area-pb">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 rounded-lg transition-colors",
              isActive 
                ? "text-violet-600 dark:text-violet-400 font-medium" 
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "fill-current/20")} />
            <span className="text-[10px] leading-none">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
