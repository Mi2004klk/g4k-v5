import { StatusType } from "../components/badge";

export const taskStatus = {
  todo:        { dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', border: 'border-t-neutral-400/50', label: 'To Do' },
  in_progress: { dot: 'bg-primary-500', bg: 'bg-primary-50 dark:bg-primary-950', text: 'text-primary-700 dark:text-primary-300', border: 'border-t-primary-500/50', label: 'In Progress' },
  review:      { dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950',     text: 'text-amber-700 dark:text-amber-300',   border: 'border-t-amber-500/50',   label: 'In Review' },
  done:        { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-t-emerald-500/50', label: 'Done' },
} as const;

export const priority = {
  urgent: { bar: 'bg-rose-500',    status: 'danger'  as StatusType, icon: 'flag',     label: 'Urgent' },
  high:   { bar: 'bg-amber-500',   status: 'warning' as StatusType, icon: 'arrowUp',  label: 'High' },
  medium: { bar: 'bg-blue-500',    status: 'info'    as StatusType, icon: 'minus',    label: 'Medium' },
  low:    { bar: 'bg-neutral-300 dark:bg-neutral-600', status: 'neutral' as StatusType, icon: 'arrowDown', label: 'Low' },
} as const;

export const attendanceStatus = {
  present:  { bg: 'bg-emerald-300 dark:bg-emerald-500', text: 'text-emerald-800 dark:text-emerald-100', label: 'Present' },
  absent:   { bg: 'bg-neutral-200 dark:bg-neutral-700', text: 'text-neutral-800 dark:text-neutral-200', label: 'Absent' },
  late:     { bg: 'bg-amber-300 dark:bg-amber-500',     text: 'text-amber-900 dark:text-amber-100',   label: 'Late' },
  on_leave: { bg: 'bg-primary-300 dark:bg-primary-500', text: 'text-primary-900 dark:text-primary-100', label: 'On Leave' },
  holiday:  { bg: 'bg-blue-300 dark:bg-blue-500',       text: 'text-blue-900 dark:text-blue-100',     label: 'Holiday' },
  overtime: { bg: 'bg-indigo-400 dark:bg-indigo-500',    text: 'text-indigo-900 dark:text-indigo-100', label: 'Overtime' },
  nodata:   { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500',                      label: 'No Data' },
} as const;

export const projectStatus = {
  active:    { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', label: 'Active' },
  review:    { dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950',     text: 'text-amber-700 dark:text-amber-300',   label: 'In Review' },
  completed: { dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950',       text: 'text-blue-700 dark:text-blue-300',     label: 'Completed' },
  archived:  { dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', label: 'Archived' },
} as const;

export const leaveStatus = {
  pending:  { dot: 'bg-amber-500',   status: 'warning' as StatusType, label: 'Pending' },
  approved: { dot: 'bg-emerald-500', status: 'success' as StatusType, label: 'Approved' },
  rejected: { dot: 'bg-rose-500',    status: 'danger'  as StatusType, label: 'Rejected' },
} as const;

export const userStatus = {
  active:   { dot: 'bg-emerald-500', status: 'success' as StatusType, label: 'Active' },
  inactive: { dot: 'bg-neutral-400', status: 'neutral' as StatusType, label: 'Inactive' },
  locked:   { dot: 'bg-rose-500',    status: 'danger'  as StatusType, label: 'Locked' },
} as const;

// The navAccent factory takes a color name (like "emerald" or "violet") and returns the full set of Tailwind classes
// for our brand theme navigation (bg, hoverBg, text, hoverText, bgDark, textDark, border, ring)
export function navAccent(color: string) {
  // Primary (violet) is the default fallback, using our primary-xxx classes
  if (color === "violet") {
    return {
      bg: "bg-primary-100", hoverBg: "hover:bg-primary-100 dark:hover:bg-primary-950",
      text: "text-primary-700", hoverText: "hover:text-primary-700 dark:hover:text-primary-300",
      bgDark: "dark:bg-primary-950", textDark: "dark:text-primary-300",
      border: "bg-primary-600", ring: "ring-1 ring-inset ring-primary-500/50"
    };
  }
  
  return {
    bg: `bg-${color}-100`, hoverBg: `hover:bg-${color}-100 dark:hover:bg-${color}-950`,
    text: `text-${color}-700`, hoverText: `hover:text-${color}-700 dark:hover:text-${color}-300`,
    bgDark: `dark:bg-${color}-950`, textDark: `dark:text-${color}-300`,
    border: `bg-${color}-600`, ring: `ring-1 ring-inset ring-${color}-500/50`
  };
}

export const typeScale = {
  display: 'text-2xl font-bold font-display',
  h1: 'text-xl font-semibold font-display',
  h2: 'text-lg font-semibold',
  h3: 'text-base font-semibold',
  body: 'text-sm',
  small: 'text-xs',
  caption: 'text-[10px] text-muted-foreground',
} as const;

export function getPriorityColor(p: string) { return priority[p as keyof typeof priority] ?? priority.low; }
export function getTaskStatusColor(s: string) { return taskStatus[s as keyof typeof taskStatus] ?? taskStatus.todo; }
export function getAttendanceStatusColor(s: string) { return attendanceStatus[s as keyof typeof attendanceStatus] ?? attendanceStatus.nodata; }
