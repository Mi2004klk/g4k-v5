import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@g4k/ui/components";
import { hasCapability } from "@/lib/capabilities";
import { useAuthStore } from "@/lib/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiFetch } from "@/lib/api-client";

export const NavItem = memo(function NavItem({ 
  item, 
  isCollapsed, 
  isSheet, 
  pins, 
  handleTogglePin, 
  getAccent 
}: any) {
  const pathname = usePathname();
  const density = useAuthStore((s) => s.density);
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const accent = getAccent(item.href);
  const currentlyCollapsed = !isSheet && isCollapsed;
  const existingPin = pins.find((p: any) => p.target_id === item.name);
  const isPinned = !!existingPin;
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
      queryClient.prefetchQuery({ queryKey: queryKeys.announcements, queryFn: () => apiFetch("/announcements") });
    } else if (item.href === "/dashboard/org/leave") {
      queryClient.prefetchQuery({ queryKey: queryKeys.orgLeaveRequestsPaginated(), queryFn: () => apiFetch("/leave-requests/pending") });
    }
  };

  const itemPy = density === "compact" ? "py-1.5" : "py-2.5";
  
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
          "flex-1 flex items-center gap-2.5 px-2.5 h-9 rounded-lg transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          currentlyCollapsed ? "justify-center px-0 text-xs" : "text-sm",
          isDisabled
            ? "opacity-50 cursor-not-allowed text-neutral-400 dark:text-neutral-600"
            : isActive
            ? "bg-surface-2 text-primary dark:text-white font-semibold shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-surface-2 hover:text-primary font-medium"
        )}
      >
        {isActive && !isDisabled && (
          <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-md", accent.border)} />
        )}
        <div className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
          (isActive && !isDisabled) ? cn(accent.bg, accent.bgDark) : "bg-transparent group-hover/nav:bg-surface-2"
        )}>
          <item.icon
            className={cn(
              "w-4 h-4 shrink-0 transition-colors",
              isDisabled
                ? "text-neutral-400 dark:text-neutral-600"
                : isActive
                ? `${accent.text} ${accent.textDark}`
                : "text-neutral-400 group-hover/nav:text-neutral-600 dark:group-hover/nav:text-neutral-300"
            )}
          />
        </div>
        {showLabels && (
          <span className={cn(
            "whitespace-nowrap transition-opacity duration-[120ms]",
            currentlyCollapsed && showLabels ? "opacity-0" : "opacity-100"
          )}>
            {item.name}
          </span>
        )}
      </Link>
      {!currentlyCollapsed && !isDisabled && (
        <button 
          onClick={(e) => { e.preventDefault(); handleTogglePin(item, existingPin); }}
          title={isPinned ? "Unpin item" : "Pin item"}
          aria-label={isPinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
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
      <Tooltip delayDuration={150}>
        <TooltipTrigger className="block w-full">{content}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", accent.bg)} />
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
});

export const NavGroup = memo(function NavGroup({ 
  group, 
  userCapabilities, 
  isCollapsed, 
  isSheet, 
  pins, 
  handleTogglePin, 
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
            pins={pins} 
            handleTogglePin={handleTogglePin} 
            getAccent={getAccent} 
          />
        ))}
      </div>
    </div>
  );
});
