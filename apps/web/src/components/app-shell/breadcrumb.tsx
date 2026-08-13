"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, IconName } from "@g4k/ui/components";
import { cn } from "@/lib/utils";

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-neutral-500 mb-4 overflow-x-auto py-1 thin-scrollbar">
      <Link
        href="/dashboard"
        className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 font-medium shrink-0"
      >
        <AppIcon name="home" size="sm" className=" shrink-0" />
        <span>Dashboard</span>
      </Link>

      {segments.slice(1).map((segment, index) => {
        let url = `/${segments.slice(0, index + 2).join("/")}`;
        if (url === "/dashboard/org") url = "/dashboard/org/users";
        const isLast = index === segments.length - 2;
        const formatted = segment.replace(/-/g, " ");

        return (
          <div key={url} className="flex items-center gap-1 capitalize min-w-0">
            <AppIcon name="chevronRight" size="xs" className=" text-neutral-400 shrink-0" />
            <Link
              href={url}
              className={cn(
                "transition-colors truncate max-w-[120px] sm:max-w-[200px] inline-block align-bottom",
                isLast
                  ? "font-semibold text-neutral-900 dark:text-white"
                  : "hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              {formatted}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
