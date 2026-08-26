export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatHoursShort(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function deriveAttendanceState(
  day: any,
  events: any[]
): "not_started" | "active" | "on_break" | "completed" {
  if (!day || !events || events.length === 0) return "not_started";

  let isActive = false;
  let isOnBreak = false;

  events.forEach(event => {
    if (event.type === 'clock_in') {
      isActive = true;
    } else if (event.type === 'clock_out') {
      isActive = false;
    } else if (event.type === 'break_start') {
      isOnBreak = true;
    } else if (event.type === 'break_end') {
      isOnBreak = false;
    }
  });

  if (isActive && !isOnBreak) return "active";
  if (isOnBreak) return "on_break";
  if (day.clock_in) return "completed";
  
  return "not_started";
}

export function deriveBreaks(events: any[], nowMs: number): number {
  if (!events || events.length === 0) return 0;
  
  let totalBreakSeconds = 0;
  let currentBreakStart: Date | null = null;

  for (const event of events) {
    if (event.type === 'break_start') {
      currentBreakStart = new Date(event.timestamp);
    } else if (event.type === 'break_end' && currentBreakStart) {
      const end = new Date(event.timestamp);
      totalBreakSeconds += Math.floor((end.getTime() - currentBreakStart.getTime()) / 1000);
      currentBreakStart = null;
    }
  }

  // Include ongoing break
  if (currentBreakStart) {
    totalBreakSeconds += Math.max(0, Math.floor((nowMs - currentBreakStart.getTime()) / 1000));
  }

  return totalBreakSeconds;
}

export function dayStatusColor(status: string, overtimeSeconds: number = 0): "success" | "neutral" | "warning" | "danger" | "info" | "purple" | "light-blue" | "blue" {
  if (status === 'on_leave' || status === 'leave') return 'purple';
  if (status === 'holiday') return 'light-blue';
  
  // Overtime overrides present if applicable
  if (status === 'present' && overtimeSeconds > 0) return 'blue';

  switch (status) {
    case 'present': return 'success';
    case 'late': return 'warning';
    case 'absent': return 'danger';
    case 'leave_pending': return 'warning';
    default: return 'neutral';
  }
}

export type SemanticStatus = "present" | "late" | "absent" | "on_leave" | "holiday" | "overtime" | "nodata";

export function resolveSemanticStatus(
  day: any,
  isHoliday: boolean = false
): { key: SemanticStatus; color: string; label: string } {
  if (day && day.status === "on_leave") return { key: "on_leave", color: "purple", label: "On Leave" };
  if (day && day.status === "late") return { key: "late", color: "warning", label: "Late" };
  if (day && day.status === "present" && (day.overtime_seconds || 0) > 0) return { key: "overtime", color: "blue", label: "Overtime" };
  if (day && day.status === "present") return { key: "present", color: "success", label: "Present" };
  
  if (isHoliday) return { key: "holiday", color: "light-blue", label: "Holiday" };
  
  if (!day) return { key: "nodata", color: "neutral", label: "No Data" };
  
  return { key: "absent", color: "danger", label: "Absent" };
}
