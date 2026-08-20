import React from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isFuture,
} from "date-fns";

export interface SemanticCalendarProps {
  /** The currently displayed month */
  currentDate: Date;
  
  /** Render prop to render a single day cell */
  renderDay: (date: Date, modifiers: {
    isCurrentMonth: boolean;
    isToday: boolean;
    isFuture: boolean;
    isWeekend: boolean;
  }) => React.ReactNode;
  
  /** Day the week starts on (0 for Sunday, 1 for Monday). Default is 0. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  
  /** Custom weekday labels (starts from Sunday). Default: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] */
  weekdayLabels?: string[];
  
  /** Optional class name for the wrapper */
  className?: string;

  /** Optional class name for the grid */
  gridClassName?: string;

  /** Optional class name for the header container */
  headerClassName?: string;
  
  /** Optional class name for individual weekday headers */
  weekdayClassName?: string;
}

export function SemanticCalendar({
  currentDate,
  renderDay,
  weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  weekStartsOn = 0,
  className = "w-full",
  gridClassName = "grid grid-cols-7 gap-1 flex-1",
  headerClassName = "grid grid-cols-7 mb-2",
  weekdayClassName = "text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-wider py-1"
}: SemanticCalendarProps) {
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn });
  const endDate = endOfWeek(monthEnd, { weekStartsOn });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className={className}>
      <div className={headerClassName}>
        {weekdayLabels.map((d, i) => (
          <div key={`${d}-${i}`} className={weekdayClassName}>
            {d}
          </div>
        ))}
      </div>
      
      <div className={gridClassName}>
        {calendarDays.map((date) => {
          const dayOfWeek = date.getDay();
          return renderDay(date, {
            isCurrentMonth: isSameMonth(date, currentDate),
            isToday: isToday(date),
            isFuture: isFuture(date),
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6
          });
        })}
      </div>
    </div>
  );
}
