import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppIcon, IconName } from "@g4k/ui/components";
import { usePins } from "@/hooks/use-pins";

export function PinnedItems({ isCollapsed }: { isCollapsed?: boolean }) {
  const { pins } = usePins();

  if (!pins || pins.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pinned
        </h3>
      )}
      <div className="flex flex-col gap-1">
        {pins.map((pin) => (
          <Link
            key={pin.id}
            href={pin.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-neutral-800",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? pin.label : undefined}
          >
            <AppIcon name={(pin.icon as IconName) || "bookmark"} size="sm" className="shrink-0" />
            {!isCollapsed && <span className="truncate">{pin.label}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
