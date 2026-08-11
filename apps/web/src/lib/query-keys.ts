export const STALE_TIME_DIRECTORY = 10 * 60_000;   // 10 min — people rarely change
export const STALE_TIME_DEPARTMENTS = 10 * 60_000;  // 10 min
export const STALE_TIME_DESIGNATIONS = 10 * 60_000; // 10 min
export const STALE_TIME_HOLIDAYS = 30 * 60_000;     // 30 min — yearly data
export const STALE_TIME_CONFIG = 60 * 60_000;       // 1 hour — settings
export const STALE_TIME_METRICS = 60_000;           // 1 min (was 30s — too aggressive)
export const STALE_TIME_ATTENDANCE = 60_000;        // 1 min
export const STALE_TIME_NOTIFICATIONS = 30_000;     // 30s
export const STALE_TIME_CONVERSATIONS = 60_000;     // 1 min
export const STALE_TIME_REPORTS = 5 * 60 * 1000;
export const STALE_TIME_PROJECTS = 60_000;          // 1 min
export const STALE_TIME_TASKS = 30_000;             // 30s (kanban needs freshness)

export const queryKeys = {
  // --- App & Core ---
  capabilities: (token: string) => ["capabilities", token] as const,
  dashboardMetrics: ["dashboard-metrics"] as const,
  dashboardLayout: ["dashboard-layout"] as const,
  
  // --- Org & Directory ---
  departments: ["departments"] as const,
  designations: ["designations"] as const,
  usersList: ["users-list"] as const,
  usersSelectList: ["users-select-list"] as const,
  orgLeaveRequests: ["org-leave-requests"] as const,
  directory: (search?: string, dept?: string, desig?: string, vis?: string) => ["directory", search ?? "", dept ?? "all", desig ?? "all", vis ?? "all"] as const,

  // --- Attendance & Time ---
  attendanceToday: ["attendance-today"] as const,
  adminAttendance: (date: string, dept?: string) => ["admin-attendance-overview", date, dept ?? "all"] as const,
  hrAttendance: (date: string, dept?: string) => ["hr-attendance-today", date, dept ?? "all"] as const,
  adminAttendanceGraph: (groupBy: string, mode: string, date: string) => ["admin-attendance-graph", groupBy, mode, date] as const,
  hrAttendanceGraph: (groupBy: string, mode: string, date: string) => ["hr-attendance-graph", groupBy, mode, date] as const,
  myLeaveHistory: (type?: string, status?: string) => ["my-leave-history", type ?? "all", status ?? "all"] as const,
  holidays: (year: number) => ["holidays", year] as const,
  memberAttendanceDay: (userId: number, date: string) => ["hr-member-attendance-day", userId, date] as const,
  memberHistory: (userId: number) => ["hr-member-history", userId] as const,
  attendanceDayDetail: (date: string, userId?: number) => ["attendance-day-detail", date, userId ?? "me"] as const,
  
  // --- Settings & Configuration ---
  settings: ["settings"] as const,
  companyProfile: ["company-profile"] as const,
  workSchedules: ["work-schedules"] as const,
  passwordResets: (status: string) => ["password-resets", status] as const,
  autoNumberings: ["auto-numberings"] as const,

  // --- Reports & Audit ---
  auditLogs: (filters: any) => ["audit-logs", filters] as const,
  savedViews: (module: string) => ["saved-views", module] as const,
  reports: (reportType: string, filters: any) => ["reports", reportType, filters] as const,
  reportData: (reportKey: string, search?: string) => ["report-data", reportKey, search ?? ""] as const,
  exportHistory: ["export-history"] as const,

  // --- Comm & Tasks ---
  pendingApprovals: ["pending-approvals-list"] as const,
  conversations: ["conversations"] as const,
  messages: (id: number) => ["messages", id] as const,
  projects: (search?: string, sort?: string, page?: string) => ["projects", search ?? "", sort ?? "", page ?? "1"] as const,
  tasks: ["tasks"] as const,
  qaForms: ["qa-forms"] as const,
  announcements: ["announcements"] as const,
  quickNotes: ["quick-notes"] as const,
  // --- Entities & Global ---
  unreadCount: ["unread-count"] as const,
  notifications: (filter?: any, search?: string, cursor?: string | null) => ["notifications", filter, search ?? "", cursor ?? ""] as const,
  project: (id: string | number) => ["project", String(id)] as const,
  profile: ["profile"] as const,
  sessions: ["sessions"] as const,
  departmentsPaginated: (search?: string, status?: string) => ["departments-paginated", search ?? "", status ?? "all"] as const,
  orgLeaveRequestsPaginated: (status?: string, search?: string) => ["org-leave-requests", status ?? "all", search ?? ""] as const,
  usersPaginated: (search?: string, role?: string, status?: string, dept?: string) => ["users", search ?? "", role ?? "all", status ?? "all", dept ?? "all"] as const,
  designationsPaginated: (search?: string, status?: string) => ["designations", search ?? "", status ?? "all"] as const,
  userActivity: (id: number) => ["user-activity", id] as const,
  department: (id: number) => ["department", id] as const,
  pins: ["pins"] as const,
  myAttendanceHistory: () => ["my-attendance-history"] as const,
  orgAttendance: ["org-attendance"] as const,
};
