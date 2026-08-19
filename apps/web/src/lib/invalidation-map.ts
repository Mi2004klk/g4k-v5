import { queryKeys } from "./query-keys";
import { QueryClient } from "@tanstack/react-query";

/**
 * Maps logical entity mutations to the query keys that need to be invalidated.
 * Used to ensure all dependent views refresh automatically without manual reloads.
 */
export const invalidationMap: Record<string, (queryClient: QueryClient, payload?: unknown) => void> = {
  // --- Users & Auth ---
  "user.crud": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.usersList });
    qc.invalidateQueries({ queryKey: queryKeys.usersSelectList });
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: queryKeys.directory() });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
  },
  
  // --- Attendance ---
  "attendance.punch": (qc, payload) => {
    qc.invalidateQueries({ queryKey: queryKeys.attendanceToday });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardMetrics });
    qc.invalidateQueries({ queryKey: queryKeys.myAttendanceHistory() });
    if (payload && typeof payload === 'object') {
      const p = payload as { userId?: number, date?: string };
      if (p.userId && p.date) {
        qc.invalidateQueries({ queryKey: queryKeys.memberAttendanceDay(p.userId, p.date) });
        qc.invalidateQueries({ queryKey: queryKeys.attendanceDayDetail(p.date, p.userId) });
      }
    }
  },

  // --- Leave & Approvals ---
  "approval.decision": (qc) => {
    qc.invalidateQueries({ queryKey: ["my-leave-history"] });
    qc.invalidateQueries({ queryKey: ["team-leave-approvals"] });
    qc.invalidateQueries({ queryKey: ["org-leave-requests"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    qc.invalidateQueries({ queryKey: queryKeys.tasks() });
    qc.invalidateQueries({ queryKey: ["projects"] });
  },
  "leave.decision": (qc) => {
    qc.invalidateQueries({ queryKey: ["my-leave-history"] });
    qc.invalidateQueries({ queryKey: ["team-leave-approvals"] });
    qc.invalidateQueries({ queryKey: ["org-leave-requests"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    // Balance invalidation would go here when implemented
  },
  "leave.request": (qc) => {
    qc.invalidateQueries({ queryKey: ["my-leave-history"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
  },

  // --- Projects & Tasks ---
  "project.crud": (qc, payload) => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    if (payload && typeof payload === 'object' && 'id' in payload) {
      const p = payload as { id: string | number };
      if (p.id) {
        qc.invalidateQueries({ queryKey: queryKeys.project(p.id) });
      }
    }
  },
  "task.crud": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.tasks });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
  },

  // --- Communications ---
  "announcement.crud": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.announcements });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
  },
  "notification.read": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.unreadCount });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  },
  "notification.new": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.unreadCount });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  },
  
  // --- Configuration ---
  "settings.update": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.settings });
    qc.invalidateQueries({ queryKey: queryKeys.companyProfile });
  },
  "department.crud": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.departments });
    qc.invalidateQueries({ queryKey: ["departments-paginated"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardInit });
  },
  "designation.crud": (qc) => {
    qc.invalidateQueries({ queryKey: queryKeys.designations });
    qc.invalidateQueries({ queryKey: ["designations"] });
  }
};

/**
 * Helper to trigger invalidation for a specific event
 */
export function triggerInvalidation(queryClient: QueryClient, eventName: keyof typeof invalidationMap, payload?: unknown) {
  const handler = invalidationMap[eventName];
  if (handler) {
    handler(queryClient, payload);
  } else {
    console.warn(`[InvalidationMap] No handler found for event: ${eventName}`);
  }
}
