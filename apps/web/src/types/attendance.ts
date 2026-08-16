export interface AttendanceEvent {
  id: number;
  user_id: number;
  type: "clock_in" | "clock_out" | "break_start" | "break_end";
  timestamp: string;
  source: string;
  ip_address?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceDay {
  id: number;
  user_id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  status: "present" | "absent" | "late" | "half_day" | "on_leave";
  worked_seconds: number;
  break_seconds: number;
  late_minutes: number;
  is_overtime: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodaySummaryResponse {
  day?: AttendanceDay;
  events?: AttendanceEvent[];
  standard_seconds: number;
}
