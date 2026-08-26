import { StatusType } from "../components/badge";

export const taskStatus = {
  todo:        { dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', border: 'border-t-neutral-400/50', label: 'To Do' },
  in_progress: { dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-t-blue-500/50', label: 'In Progress' },
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

type NavAccentConfig = {
  bg: string; hoverBg: string; text: string; hoverText: string; bgDark: string; textDark: string; border: string; ring: string;
};

const navAccentMap: Record<string, NavAccentConfig> = {
  violet: { bg: "bg-primary-100", hoverBg: "hover:bg-primary-100 dark:hover:bg-primary-950", text: "text-primary-700", hoverText: "hover:text-primary-700 dark:hover:text-primary-300", bgDark: "dark:bg-primary-950", textDark: "dark:text-primary-300", border: "bg-primary-600", ring: "ring-1 ring-inset ring-primary-500/50" },
  blue: { bg: "bg-blue-100", hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-950", text: "text-blue-700", hoverText: "hover:text-blue-700 dark:hover:text-blue-300", bgDark: "dark:bg-blue-950", textDark: "dark:text-blue-300", border: "bg-blue-600", ring: "ring-1 ring-inset ring-blue-500/50" },
  green: { bg: "bg-green-100", hoverBg: "hover:bg-green-100 dark:hover:bg-green-950", text: "text-green-700", hoverText: "hover:text-green-700 dark:hover:text-green-300", bgDark: "dark:bg-green-950", textDark: "dark:text-green-300", border: "bg-green-600", ring: "ring-1 ring-inset ring-green-500/50" },
  indigo: { bg: "bg-indigo-100", hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-950", text: "text-indigo-700", hoverText: "hover:text-indigo-700 dark:hover:text-indigo-300", bgDark: "dark:bg-indigo-950", textDark: "dark:text-indigo-300", border: "bg-indigo-600", ring: "ring-1 ring-inset ring-indigo-500/50" },
  pink: { bg: "bg-pink-100", hoverBg: "hover:bg-pink-100 dark:hover:bg-pink-950", text: "text-pink-700", hoverText: "hover:text-pink-700 dark:hover:text-pink-300", bgDark: "dark:bg-pink-950", textDark: "dark:text-pink-300", border: "bg-pink-600", ring: "ring-1 ring-inset ring-pink-500/50" },
  amber: { bg: "bg-amber-100", hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-950", text: "text-amber-700", hoverText: "hover:text-amber-700 dark:hover:text-amber-300", bgDark: "dark:bg-amber-950", textDark: "dark:text-amber-300", border: "bg-amber-600", ring: "ring-1 ring-inset ring-amber-500/50" },
  cyan: { bg: "bg-cyan-100", hoverBg: "hover:bg-cyan-100 dark:hover:bg-cyan-950", text: "text-cyan-700", hoverText: "hover:text-cyan-700 dark:hover:text-cyan-300", bgDark: "dark:bg-cyan-950", textDark: "dark:text-cyan-300", border: "bg-cyan-600", ring: "ring-1 ring-inset ring-cyan-500/50" },
  teal: { bg: "bg-teal-100", hoverBg: "hover:bg-teal-100 dark:hover:bg-teal-950", text: "text-teal-700", hoverText: "hover:text-teal-700 dark:hover:text-teal-300", bgDark: "dark:bg-teal-950", textDark: "dark:text-teal-300", border: "bg-teal-600", ring: "ring-1 ring-inset ring-teal-500/50" },
  rose: { bg: "bg-rose-100", hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-950", text: "text-rose-700", hoverText: "hover:text-rose-700 dark:hover:text-rose-300", bgDark: "dark:bg-rose-950", textDark: "dark:text-rose-300", border: "bg-rose-600", ring: "ring-1 ring-inset ring-rose-500/50" },
};

export function navAccent(color: string) {
  return navAccentMap[color] ?? navAccentMap.violet;
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
export function getProjectStatusColor(s: string) { return projectStatus[s as keyof typeof projectStatus] ?? projectStatus.archived; }
export function getLeaveStatusColor(s: string) { return leaveStatus[s as keyof typeof leaveStatus] ?? leaveStatus.pending; }
export function getUserStatusColor(s: string) { return userStatus[s as keyof typeof userStatus] ?? userStatus.inactive; }

export const heatmapIntensity = {
  high:   { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-white' },
  medium: { bg: 'bg-emerald-300 dark:bg-emerald-500/80', text: 'text-emerald-950 dark:text-emerald-50' },
  low:    { bg: 'bg-amber-300 dark:bg-amber-500/80', text: 'text-amber-950 dark:text-amber-50' },
  critical: { bg: 'bg-rose-400 dark:bg-rose-500/80', text: 'text-white' },
  empty:  { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500 dark:text-neutral-400' },
} as const;

export type HeatmapLevel = typeof heatmapIntensity[keyof typeof heatmapIntensity];
