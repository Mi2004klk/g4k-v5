import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppIcon, IconName } from "@g4k/ui/components";
import { hasCapability } from "@/lib/capabilities";
import { useAuthStore } from "@/lib/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiFetch } from "@/lib/api-client";

export const NavItem = memo(function NavItem({ 
  item, 
  isCollapsed, 
  isSheet, 
  getAccent 
}: any) {
  const pathname = usePathname();
  const density = useAuthStore((s) => s.density);
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const accent = getAccent(item.href);
  const currentlyCollapsed = !isSheet && isCollapsed;
  const isDisabled = !!item.disabled;
  
  // Phased Label fade
  const [showLabels, setShowLabels] = useState(!currentlyCollapsed);
  
  useEffect(() => {
    if (currentlyCollapsed) {
      const t = setTimeout(() => setShowLabels(false), 120);
      return () => clearTimeout(t);
    }
    setShowLabels(true);
  }, [currentlyCollapsed]);

  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    if (isDisabled) return;
    if (item.href === "/dashboard/leave") {
      queryClient.prefetchQuery({ queryKey: queryKeys.myLeaveHistory(), queryFn: () => apiFetch("/leave-requests/history") });
    } else if (item.href === "/dashboard/directory") {
      queryClient.prefetchQuery({ queryKey: queryKeys.directory(), queryFn: () => apiFetch("/directory") });
    } else if (item.href === "/dashboard/projects") {
      queryClient.prefetchQuery({ queryKey: queryKeys.projects(), queryFn: () => apiFetch("/projects") });
    } else if (item.href === "/dashboard/tasks") {
      queryClient.prefetchQuery({ queryKey: queryKeys.tasks, queryFn: () => apiFetch("/tasks") });
    } else if (item.href === "/dashboard/announcements") {
      queryClient.prefetchQuery({ queryKey: queryKeys.dashboardInit, queryFn: () => apiFetch("/dashboard/init") });
    } else if (item.href === "/dashboard/org/leave") {
      queryClient.prefetchQuery({ queryKey: queryKeys.orgLeaveRequestsPaginated(), queryFn: () => apiFetch("/leave-requests/pending") });
    }
  };

  const itemPy = density === "compact" ? "py-1.5" : "py-2";
  
  const content = (
    <div className="relative group/nav flex items-center">
      <Link
        href={isDisabled ? "#" : item.href}
        prefetch={false}
        onMouseEnter={handleMouseEnter}
        onClick={(e) => {
          if (isDisabled) e.preventDefault();
        }}
        aria-disabled={isDisabled}
        aria-label={item.name}
        className={cn(
          "flex-1 flex items-center gap-3 px-3 transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-[var(--radius)]",
          itemPy,
          currentlyCollapsed ? "justify-center px-0 text-[13px]" : "text-sm",
          isDisabled
            ? "opacity-50 cursor-not-allowed text-neutral-400 dark:text-neutral-600"
            : isActive
            ? cn("font-semibold shadow-e1 ring-1 ring-inset", accent.bg, accent.bgDark, accent.ring, accent.text, accent.textDark)
            : cn("text-neutral-700 dark:text-neutral-300 font-medium group-hover/nav:bg-opacity-50 hover:shadow-e1", accent.hoverBg, accent.hoverText)
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-[var(--radius)] flex items-center justify-center shrink-0 transition-colors bg-transparent"
        )}>
          <AppIcon
            name={item.icon}
            size="md"
            className={cn(
              "shrink-0 transition-colors",
              isDisabled
                ? "text-neutral-400 dark:text-neutral-600"
                : isActive
                ? "text-inherit"
                : cn(accent.text, "group-hover/nav:text-inherit")
            )}
          />
        </div>
        {showLabels && (
          <span className={cn(
            "whitespace-nowrap transition-opacity duration-[120ms]",
            currentlyCollapsed && showLabels ? "opacity-0" : "opacity-100"
          )}>
            {item.name}
            {isActive && <span className="sr-only"> (Current)</span>}
          </span>
        )}
      </Link>
    </div>
  );

  return content;
});

export const NavGroup = memo(function NavGroup({ 
  group, 
  userCapabilities, 
  isCollapsed, 
  isSheet, 
  getAccent 
}: any) {
  // Filter items by capability
  const visibleItems = group.items.filter(
    (item: any) => !item.capability || hasCapability(userCapabilities, item.capability)
  );

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-2">
      {(!isCollapsed || isSheet) ? (
        <div className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase px-3 mb-1 mt-4 transition-opacity duration-[120ms]">
          {group.label}
        </div>
      ) : (
        <div className="h-px bg-border mx-2 my-3 transition-opacity duration-[120ms]" />
      )}
      <div className="flex flex-col gap-1">
        {visibleItems.map((item: any) => (
          <NavItem 
            key={item.name} 
            item={item} 
            isCollapsed={isCollapsed} 
            isSheet={isSheet} 
            getAccent={getAccent} 
          />
        ))}
      </div>
    </div>
  );
});
