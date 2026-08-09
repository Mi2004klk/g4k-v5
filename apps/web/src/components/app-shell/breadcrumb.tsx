"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-neutral-500 mb-4 overflow-x-auto py-1">
      <Link
        href="/dashboard"
        className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Dashboard</span>
      </Link>

      {segments.slice(1).map((segment, index) => {
        const url = `/${segments.slice(0, index + 2).join("/")}`;
        const isLast = index === segments.length - 2;
        const formatted = segment.replace(/-/g, " ");

        return (
          <div key={url} className="flex items-center gap-1 capitalize">
            <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-neutral-900 dark:text-white">
                {formatted}
              </span>
            ) : (
              <Link
                href={url}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {formatted}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
