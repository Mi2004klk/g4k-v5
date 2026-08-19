"use client";

import { useMemo, useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  subWeeks,
  eachWeekOfInterval,
} from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import {
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@g4k/ui/components";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@g4k/ui/components/badge";
import { safeFormat } from "@/lib/format";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useIsMobile } from "@g4k/ui/hooks";
import { useTimerStore } from "@/stores/timer-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HolidayRecord {
  date: string;
  name?: string;
  type?: string;
}

interface AttendanceEvent {
  id: number;
  user_id: number;
  type: string;
  timestamp: string;
  device_meta: Record<string, unknown>;
  source: string;
}

interface AttendanceDay {
  id: number;
  user_id: number;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  first_event: string | null;
  last_event: string | null;
  total_seconds: number;
  break_seconds: number;
  overtime_seconds: number;
  late_minutes: number;
  status: string;
  has_open_shift: boolean;
  projects?: string[];
  tasks?: string[];
}

type DayStatus = "present" | "overtime" | "late" | "leave" | "absent" | "holiday" | "nodata";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSecs(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

function getStatus(days: AttendanceDay[], holidays: HolidayRecord[], dateStr: string): DayStatus {
  const day = days.find((d) => d.date === dateStr);
  const isHoliday = holidays.find((h) => h.date === dateStr);
  
  if (day && day.status === "leave") return "leave";
  if (day && day.status === "late") return "late";
  if (day && day.status === "present" && day.overtime_seconds > 0) return "overtime";
  if (day && day.status === "present") return "present";
  
  if (isHoliday) return "holiday";
  
  if (!day) return "nodata";
  return "absent";
}

function getDayRecord(days: AttendanceDay[], dateStr: string): AttendanceDay | undefined {
  return days.find((d) => d.date === dateStr);
}

const STATUS_STYLES: Record<DayStatus, string> = {
  nodata: "bg-neutral-100 dark:bg-neutral-800",
  absent: "bg-neutral-200 dark:bg-neutral-700",
  late: "bg-amber-300 dark:bg-amber-500",
  present: "bg-emerald-300 dark:bg-emerald-500",
  overtime: "bg-indigo-400 dark:bg-indigo-500",
  leave: "bg-primary-300 dark:bg-primary-500",
  holiday: "bg-blue-300 dark:bg-blue-500",
};

const STATUS_LABEL: Record<DayStatus, string> = {
  nodata: "No data",
  absent: "Absent",
  late: "Late",
  present: "Present",
  overtime: "Overtime",
  leave: "On Leave",
  holiday: "Holiday",
};

// ─── Legend ──────────────────────────────────────────────────────────────────

function CalendarLegend({ compact = false }: { compact?: boolean }) {
  const items: [DayStatus, string][] = [
    ["nodata", "No Data"],
    ["late", "Late"],
    ["present", "Present"],
    ["overtime", "Overtime"],
    ["leave", "Leave"],
    ["holiday", "Holiday"],
  ];
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${compact ? "gap-x-2" : ""}`}
      aria-label="Calendar legend"
    >
      {items.map(([status, label]) => (
        <span key={status} className="flex items-center gap-1">
          <span
            className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"} rounded-sm flex-shrink-0 ${STATUS_STYLES[status]}`}
            aria-hidden
          />
          <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-neutral-500 dark:text-neutral-400`}>
            {compact ? label.split(" ")[0] : label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Day Tooltip Content ──────────────────────────────────────────────────────

function DayTooltipContent({ date, record, holiday }: { date: Date; record?: AttendanceDay; holiday?: HolidayRecord }) {
  const dateStr = format(date, "yyyy-MM-dd");
  const status = getStatus(record ? [record] : [], holiday ? [holiday] : [], dateStr);
  return (
    <div className="space-y-1 text-left min-w-[120px]">
      <p className="font-semibold text-xs">{format(date, "EEEE, MMM d")}</p>
      {holiday && (
        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
          {holiday.name} {holiday.type === 'event' ? '(Event)' : ''}
        </p>
      )}
      <p className="text-[11px] capitalize">
        <span
          className={`inline-block w-2 h-2 rounded-sm mr-1 ${STATUS_STYLES[status]}`}
          aria-hidden
        />
        {STATUS_LABEL[status]}
      </p>
      {record && record.total_seconds > 0 && (
        <p className="text-[11px] text-neutral-400">
          Worked: <span className="font-mono font-medium text-neutral-200">{formatSecs(record.total_seconds)}</span>
        </p>
      )}
      {record && record.overtime_seconds > 0 && (
        <p className="text-[11px] text-amber-400 font-mono">
          +{formatSecs(record.overtime_seconds)} OT
        </p>
      )}
      {record && record.status === "late" && record.late_minutes > 0 && (
        <p className="text-[11px] text-amber-400">{record.late_minutes}m late</p>
      )}
      <p className="text-[10px] text-neutral-500 mt-0.5">Click to view timeline</p>
    </div>
  );
}

// ─── Month Calendar Grid (Desktop) ───────────────────────────────────────────

function MonthCalendarGrid({
  days,
  holidays,
  currentDate,
  onDayClick,
}: {
  days: AttendanceDay[];
  holidays: HolidayRecord[];
  currentDate: Date;
  onDayClick: (day: AttendanceDay | null, date: Date) => void;
}) {
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full" data-testid="month-calendar-grid">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 border-t border-l border-border/50" data-testid="month-calendar-grid-cells">
        {calendarDays.map((date, i) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isCurrMonth = isSameMonth(date, currentDate);
          const isCurrDay = isToday(date);
          const record = getDayRecord(days, dateStr);
          const holiday = holidays.find(h => h.date === dateStr);
          const status = getStatus(days, holidays, dateStr);
          const isFuture = date > new Date();

          return (
            <Tooltip key={dateStr}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDayClick(record || null, date)}
                  disabled={isFuture}
                  className={`
                    relative p-1 md:p-2 min-h-[4rem] md:min-h-[5.5rem] border-r border-b border-border/50
                    hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors
                    flex flex-col items-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                    ${!isCurrMonth ? "opacity-30 bg-neutral-50/50 dark:bg-neutral-900/50" : ""}
                    ${isFuture ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                  `}
                  aria-label={`View details for ${dateStr}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs md:text-sm font-semibold flex items-center justify-center
                      ${isCurrDay ? "bg-primary-600 text-white w-6 h-6 rounded-full" : "text-neutral-700 dark:text-neutral-300 w-6 h-6"}
                    `}
                    >
                      {format(date, "d")}
                    </span>
                    {status !== "nodata" && (
                      <div
                        className={`w-2 h-2 rounded-full ${STATUS_STYLES[status]}`}
                        title={STATUS_LABEL[status]}
                      />
                    )}
                  </div>
                  {/* Compact timeline bar for desktop */}
                  {record && record.first_event && record.last_event && (
                    <div className="hidden md:block w-full mt-auto">
                      <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-sm overflow-hidden flex">
                        {record.break_seconds > 0 ? (
                          <div className="flex w-full h-full">
                            <div className="h-full bg-primary-400" style={{ width: "45%" }} />
                            <div className="h-full bg-amber-400" style={{ width: "10%" }} />
                            <div className="h-full bg-primary-400" style={{ width: "45%" }} />
                          </div>
                        ) : (
                          <div className="h-full bg-primary-400 w-full" />
                        )}
                      </div>
                    </div>
                  )}
                  {holiday && (
                    <div className="w-full mt-auto truncate text-[9px] text-blue-600 dark:text-blue-400 font-semibold hidden md:block">
                      {holiday.name}
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-3 shadow-xl">
                <DayTooltipContent date={date} record={record} holiday={holiday} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Activity Strip (Mobile — GitHub-style) ──────────────────────────────────



// ─── Main Export ─────────────────────────────────────────────────────────────

export function AttendanceHistoryCalendar({
  days,
  userId,
}: {
  days: AttendanceDay[];
  userId?: number;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<AttendanceDay | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const isMobile = useIsMobile();

  const prevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));

  // FE-ATT-02: Month-scoped fetching
  const { data: monthData } = useQuery({
    queryKey: ['attendanceMonth', userId || 'me', format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const monthStr = format(currentDate, "yyyy-MM");
      if (userId) {
        return apiFetch(`/attendance/hr/history/${userId}?month=${monthStr}&per_page=100`).then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : []))));
      }
      return apiFetch(`/attendance/me/history?month=${monthStr}&per_page=100`).then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : []))));
    },
  });

  // Merge parent days (initial load) with our fetched monthData
  const allDays = useMemo(() => {
    const combined = [...days];
    if (monthData && Array.isArray(monthData)) {
      monthData.forEach((d: AttendanceDay) => {
        if (!combined.find(c => c.date === d.date)) {
          combined.push(d);
        }
      });
    }
    return combined;
  }, [days, monthData]);

  // Count records for this specific month
  const recordsThisMonth = useMemo(() => {
    return allDays.filter(d => d.date.startsWith(format(currentDate, "yyyy-MM"))).length;
  }, [allDays, currentDate]);

  const { data: holidaysData } = useQuery({
    queryKey: queryKeys.holidays(currentDate.getFullYear()),
    queryFn: () => apiFetch(`/holidays?year=${currentDate.getFullYear()}`),
  });
  const holidays = Array.isArray(holidaysData) 
    ? holidaysData 
    : (Array.isArray(holidaysData?.data) ? holidaysData.data : []);

  const handleDayClick = (record: AttendanceDay | null, date: Date) => {
    if (record) {
      setSelectedDay(record);
      setSelectedDate(date);
    } else {
      const synthetic: AttendanceDay = {
        id: 0,
        user_id: 0,
        date: format(date, "yyyy-MM-dd"),
        clock_in: null,
        clock_out: null,
        first_event: null,
        last_event: null,
        total_seconds: 0,
        break_seconds: 0,
        overtime_seconds: 0,
        late_minutes: 0,
        status: "nodata",
        has_open_shift: false,
      };
      setSelectedDay(synthetic);
      setSelectedDate(date);
    }
  };

  return (
    <div className="w-full space-y-4" data-testid="attendance-history-calendar">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-base text-neutral-900 dark:text-white leading-tight">
            {format(currentDate, "MMMM yyyy")}
          </h3>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            {recordsThisMonth} record{recordsThisMonth !== 1 ? "s" : ""} this month
          </p>
        </div>
        
        {/* Navigation available on both desktop and mobile now */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <AppIcon name="chevronLeft" size="sm" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <AppIcon name="chevronRight" size="sm" />
          </Button>
        </div>
      </div>

      {/* ── Calendar / Strip ───────────────────────────── */}
      <MonthCalendarGrid
        days={allDays}
        holidays={holidays}
        currentDate={currentDate}
        onDayClick={handleDayClick}
      />

      {/* ── Legend ─────────────────────────────────────── */}
      <CalendarLegend compact={isMobile} />

      {/* ── Day Detail Dialog ──────────────────────────── */}
      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDay(null);
            setSelectedDate(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span>
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Day Details"}
              </span>
              {selectedDay?.has_open_shift && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                  Open Shift
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              View detailed attendance records and punch timeline for the selected date.
            </DialogDescription>
          </DialogHeader>
          {selectedDay && (
            <DayDetailContent
              date={selectedDay.date}
              summaryDay={selectedDay}
              userId={userId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Day Detail Content ───────────────────────────────────────────────────────

function DayDetailContent({
  date,
  summaryDay,
  userId,
}: {
  date: string;
  summaryDay: AttendanceDay;
  userId?: number;
}) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.attendanceDayDetail(date, userId),
    queryFn: () =>
      apiFetch(
        userId ? `/attendance/hr/day/${date}/${userId}` : `/attendance/me/day/${date}`
      ),
    enabled: summaryDay.id > 0, // skip synthetic empty day
  });

  const events: AttendanceEvent[] = data?.events || [];
  const day: AttendanceDay = data?.day || summaryDay;
  const timerStandard = useTimerStore((s) => s.standardSeconds);

  if (summaryDay.id === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
        <AppIcon name="calendar" size="2xl" />
        <p className="text-sm font-medium text-neutral-500">No attendance record for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Summary bar */}
      <div className="flex justify-between items-start bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
        <div className="space-y-1">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Status</p>
          <p className="capitalize font-medium flex items-center gap-2">
            {day.status}
            {day.status === "late" && (
              <StatusBadge status="warning">{day.late_minutes}m Late</StatusBadge>
            )}
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
            Total Worked
          </p>
          <p className="font-mono font-bold text-primary-600">{formatSecs(day.total_seconds)}</p>
          {day.overtime_seconds > 0 && (
            <p className="text-[10px] font-bold text-indigo-600 font-mono">
              +{formatSecs(day.overtime_seconds)} OT
            </p>
          )}
        </div>
      </div>

      {/* Punch timeline */}
      <div>
        <h4 className="text-sm font-bold mb-3">Punch Timeline</h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">No punches recorded for this day.</p>
        ) : (
          <div className="space-y-2">
            {events.map((evt: AttendanceEvent) => (
              <div
                key={evt.id}
                className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-[var(--radius)] p-3 border border-neutral-100 dark:border-neutral-800"
              >
                <div className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                    {evt.type.replace(/_/g, " ")}
                  </span>
                  <div className="font-mono text-sm font-semibold mt-0.5">
                    {safeFormat(evt.timestamp, "hh:mm a")}
                  </div>
                </div>
                {!!(evt.device_meta as any)?.platform && (
                  <span className="text-[9px] text-neutral-400 shrink-0 hidden sm:block">
                    {evt.device_meta.platform as string}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      {Array.isArray(data?.projects) && data.projects.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2">Projects Worked</h4>
          <div className="flex flex-wrap gap-2">
            {data.projects.map((p: string, i: number) => (
              <span
                key={i}
                className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      {Array.isArray(data?.tasks) && data.tasks.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2">Tasks Completed</h4>
          <div className="flex flex-wrap gap-2">
            {data.tasks.map((t: string, i: number) => (
              <span
                key={i}
                className="text-[10px] bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 px-2 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
