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
  isSameDay,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useIsMobile } from "@g4k/ui/hooks";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AttendanceEvent {
  id: number;
  user_id: number;
  type: string;
  timestamp: string;
  device_meta: any;
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

type DayStatus = "present" | "overtime" | "late" | "leave" | "absent" | "nodata";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSecs(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

function getStatus(days: AttendanceDay[], dateStr: string): DayStatus {
  const day = days.find((d) => d.date === dateStr);
  if (!day) return "nodata";
  if (day.status === "leave") return "leave";
  if (day.status === "late") return "late";
  if (day.status === "present" && day.overtime_seconds > 0) return "overtime";
  if (day.status === "present") return "present";
  return "absent";
}

function getDayRecord(days: AttendanceDay[], dateStr: string): AttendanceDay | undefined {
  return days.find((d) => d.date === dateStr);
}

const STATUS_STYLES: Record<DayStatus, string> = {
  nodata:   "bg-neutral-100 dark:bg-neutral-800",
  absent:   "bg-neutral-200 dark:bg-neutral-700",
  late:     "bg-amber-300 dark:bg-amber-500",
  present:  "bg-emerald-300 dark:bg-emerald-500",
  overtime: "bg-indigo-400 dark:bg-indigo-500",
  leave:    "bg-violet-300 dark:bg-violet-500",
};

const STATUS_LABEL: Record<DayStatus, string> = {
  nodata:   "No data",
  absent:   "Absent",
  late:     "Late",
  present:  "Present",
  overtime: "Overtime",
  leave:    "On Leave",
};

// ─── Legend ──────────────────────────────────────────────────────────────────

function CalendarLegend({ compact = false }: { compact?: boolean }) {
  const items: [DayStatus, string][] = [
    ["nodata",   "No Data"],
    ["late",     "Late"],
    ["present",  "Present"],
    ["overtime", "Overtime"],
    ["leave",    "Leave"],
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

function DayTooltipContent({ date, record }: { date: Date; record?: AttendanceDay }) {
  const dateStr = format(date, "yyyy-MM-dd");
  const status = record ? getStatus([record], dateStr) : "nodata";
  return (
    <div className="space-y-1 text-left min-w-[120px]">
      <p className="font-semibold text-xs">{format(date, "EEEE, MMM d")}</p>
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
  currentDate,
  onDayClick,
}: {
  days: AttendanceDay[];
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
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const inCurrentMonth = isSameMonth(date, currentDate);
            const record = getDayRecord(days, dateStr);
            const status = getStatus(days, dateStr);
            const isKnownDay = !!record;
            const todayFlag = isToday(date);

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid={`day-cell-${dateStr}`}
                    onClick={() => isKnownDay || inCurrentMonth ? onDayClick(record ?? null, date) : undefined}
                    disabled={!isKnownDay && !inCurrentMonth}
                    className={[
                      "relative flex flex-col items-center justify-center rounded-md",
                      "aspect-square w-full text-[11px] font-medium transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                      inCurrentMonth ? "opacity-100" : "opacity-25 pointer-events-none",
                      isKnownDay
                        ? `${STATUS_STYLES[status]} hover:scale-110 hover:shadow-md cursor-pointer`
                        : "bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-default",
                      todayFlag ? "ring-2 ring-violet-400 ring-offset-1 dark:ring-offset-neutral-900" : "",
                    ].join(" ")}
                    aria-label={`${format(date, "MMM d")}: ${STATUS_LABEL[status]}`}
                  >
                    <span
                      className={[
                        "text-[11px] font-semibold leading-none",
                        isKnownDay && status === "present"
                          ? "text-emerald-900 dark:text-emerald-100"
                          : isKnownDay && status === "overtime"
                          ? "text-indigo-900 dark:text-indigo-100"
                          : isKnownDay && status === "late"
                          ? "text-amber-900 dark:text-amber-100"
                          : isKnownDay && status === "leave"
                          ? "text-violet-900 dark:text-violet-100"
                          : "text-neutral-600 dark:text-neutral-400",
                      ].join(" ")}
                    >
                      {format(date, "d")}
                    </span>
                    
                    {/* Tiny overtime indicator if day is late but also has overtime */}
                    {record && record.overtime_seconds > 0 && status === "late" && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-e1 hover:shadow-e2 transition-shadow duration-150" aria-label="Has overtime" />
                    )}
                    {/* Subtle clock-in indicator dot */}
                    {record?.clock_in && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/60 dark:bg-black/30" />
                    )}
                  </button>
                </TooltipTrigger>
                {inCurrentMonth && (
                  <TooltipContent side="top" className="max-w-[180px]">
                    <DayTooltipContent date={date} record={record} />
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Activity Strip (Mobile — GitHub-style) ──────────────────────────────────

function ActivityStrip({
  days,
  onDayClick,
}: {
  days: AttendanceDay[];
  onDayClick: (day: AttendanceDay | null, date: Date) => void;
}) {
  // Show rolling 16 weeks (112 days) ending today
  const today = new Date();
  const WEEKS = 16;
  const start = startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });

  const weeks = useMemo(() => {
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    return weekStarts.map((weekStart) =>
      eachDayOfInterval({
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      })
    );
  }, []);

  const WEEKDAY_LABELS_SHORT = ["M", "W", "F"]; // only show alternate for compactness

  return (
    <div className="w-full" data-testid="activity-strip">
      <div className="flex items-start gap-px overflow-x-auto pb-1 scrollbar-none">
        {/* Y-axis weekday labels */}
        <div className="flex flex-col gap-px mr-1 shrink-0 pt-5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span
              key={i}
              className={`h-[10px] text-[8px] text-neutral-400 leading-[10px] ${
                i % 2 === 0 ? "visible" : "invisible"
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => {
          const weekLabel =
            wi === 0 || (wi > 0 && !isSameMonth(week[0], weeks[wi - 1]?.[0]))
              ? format(week[0], "MMM")
              : null;
          return (
            <div key={wi} className="flex flex-col gap-px shrink-0">
              {/* Month label at top */}
              <span className="h-4 text-[8px] text-neutral-400 whitespace-nowrap leading-4 mb-px">
                {weekLabel || ""}
              </span>
              {week.map((date, di) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const record = getDayRecord(days, dateStr);
                const status = getStatus(days, dateStr);
                const isFuture = date > today;
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => !isFuture && onDayClick(record ?? null, date)}
                    disabled={isFuture}
                    title={`${format(date, "MMM d")} — ${STATUS_LABEL[status]}`}
                    className={[
                      "w-[10px] h-[10px] rounded-[2px] transition-all duration-150",
                      isFuture
                        ? "bg-neutral-100 dark:bg-neutral-800 opacity-30 cursor-default"
                        : `${STATUS_STYLES[status]} hover:scale-125 hover:z-10 cursor-pointer`,
                    ].join(" ")}
                    aria-label={`${format(date, "MMM d")}: ${STATUS_LABEL[status]}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  const handleDayClick = (record: AttendanceDay | null, date: Date) => {
    if (record) {
      setSelectedDay(record);
      setSelectedDate(date);
    } else {
      // Day in current month but no record — still allow opening (shows empty timeline)
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
            {days.length} record{days.length !== 1 ? "s" : ""} this month
          </p>
        </div>
        {/* Show nav only on desktop or when in month view */}
        {!isMobile && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Calendar / Strip ───────────────────────────── */}
      {isMobile ? (
        <ActivityStrip days={days} onDayClick={handleDayClick} />
      ) : (
        <MonthCalendarGrid
          days={days}
          currentDate={currentDate}
          onDayClick={handleDayClick}
        />
      )}

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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
  const standardSeconds: number = data?.standard_seconds || 31500;

  if (summaryDay.id === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
        <span className="text-3xl">🗓</span>
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
          <p className="font-mono font-bold text-violet-600">{formatSecs(day.total_seconds)}</p>
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
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">No punches recorded for this day.</p>
        ) : (
          <div className="space-y-2">
            {events.map((evt: AttendanceEvent) => (
              <div
                key={evt.id}
                className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800"
              >
                <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                    {evt.type.replace(/_/g, " ")}
                  </span>
                  <div className="font-mono text-sm font-semibold mt-0.5">
                    {format(new Date(evt.timestamp), "hh:mm a")}
                  </div>
                </div>
                {evt.device_meta?.platform && (
                  <span className="text-[9px] text-neutral-400 shrink-0 hidden sm:block">
                    {evt.device_meta.platform}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      {data?.projects && data.projects.length > 0 && (
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
      {data?.tasks && data.tasks.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2">Tasks Completed</h4>
          <div className="flex flex-wrap gap-2">
            {data.tasks.map((t: string, i: number) => (
              <span
                key={i}
                className="text-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2 py-1 rounded-full"
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
