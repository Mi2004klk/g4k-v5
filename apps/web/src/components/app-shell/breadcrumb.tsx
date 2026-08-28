"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, IconName } from "@g4k/ui/components";
import { cn } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_USERS, STALE_TIME_PROJECTS } from "@/lib/query-keys";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Administration",
  org: "Organization",
  users: "Employee Directory",
  leave: "Leave Management",
  attendance: "Attendance Records",
  settings: "Settings",
  projects: "Projects",
  tasks: "Task Management",
  reports: "Reports",
  chat: "Team Chat",
  profile: "My Profile",
  announcements: "Announcements",
  notifications: "Notifications",
  audit: "Audit Logs",
};

function BreadcrumbSegment({
  segment,
  parentSegment,
  url,
  isLast,
}: {
  segment: string;
  parentSegment: string;
  url: string;
  isLast: boolean;
}) {
  let formatted = SEGMENT_LABELS[segment] || segment.replace(/-/g, " ");

  const isNumericId = !isNaN(Number(segment));
  const isUserSegment = isNumericId && parentSegment === "users";
  const isProjectSegment = isNumericId && parentSegment === "projects";

  const { data: userData } = useQuery({
    queryKey: queryKeys.user(Number(segment)),
    queryFn: () => apiFetch(`/users/${segment}`),
    enabled: isUserSegment,
    staleTime: STALE_TIME_USERS,
  });

  const { data: projectData } = useQuery({
    queryKey: queryKeys.project(Number(segment)),
    queryFn: () => apiFetch(`/projects/${segment}`),
    enabled: isProjectSegment,
    staleTime: STALE_TIME_PROJECTS,
  });

  if (isUserSegment) {
    if (userData?.data?.name) {
      formatted = userData.data.name;
    } else if (userData?.name) {
      formatted = userData.name;
    } else {
      formatted = "Profile"; // Fallback while loading or error
    }
  } else if (isProjectSegment) {
    if (projectData?.data?.name) {
      formatted = projectData.data.name;
    } else if (projectData?.name) {
      formatted = projectData.name;
    } else {
      formatted = "Project"; // Fallback while loading or error
    }
  }

  return (
    <div className="flex items-center gap-1 capitalize min-w-0">
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
}

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
        if (url === "/dashboard/org") url = "/dashboard/directory";
        if (segment === "org") return null; // Skip 'org' in breadcrumb display
        const isLast = index === segments.length - 2;
        const parentSegment = segments[index]; // Because we slice(1), segments[index] refers to the parent
        
        return (
          <BreadcrumbSegment
            key={url}
            segment={segment}
            parentSegment={parentSegment}
            url={url}
            isLast={isLast}
          />
        );
      })}
    </nav>
  );
}
