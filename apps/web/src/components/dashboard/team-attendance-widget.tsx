"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Avatar, AvatarFallback, AvatarImage, Button } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { AppIcon } from "@g4k/ui/components";

interface TeamAttendanceRecord {
  user_id: string | number;
  user_name: string;
  avatar_url?: string;
  department_name?: string;
  category: 'present' | 'late' | 'leave' | 'leave_pending' | 'absent' | string;
  clock_in?: string;
  late_minutes?: number;
  leave_type?: string;
}

export function TeamAttendanceWidget() {
  const date = format(new Date(), "yyyy-MM-dd");
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["attendance", "team-today", date],
    queryFn: () => apiFetch(`/attendance/team-today?date=${date}`),
    staleTime: 60000,
  });

  if (isError) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <AppIcon name="directory" className=" text-primary-600" />
            <span className="text-sm font-bold">Team Attendance</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-[var(--radius)] p-4 mt-4">
          <AppIcon name="warning" size="xl" className=" text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load attendance</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const counts = data?.counts || { present: 0, late: 0, leave: 0, absent: 0, leave_pending: 0 };
  const employees = Array.isArray(data?.employees) ? data.employees : (Array.isArray(data) ? data : []);

  if (!isLoading && employees.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center border-none shadow-e1 overflow-hidden p-6 text-center">
        <div className="text-sm font-semibold text-muted-foreground">No team members scheduled today</div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-none shadow-e1 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AppIcon name="directory" className=" text-primary-600" />
            Today&apos;s Team Attendance
          </CardTitle>
          {isLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {counts.present > 0 && <StatusBadge status="success">{counts.present} Present</StatusBadge>}
              {counts.late > 0 && <StatusBadge status="warning">{counts.late} Late</StatusBadge>}
              {counts.leave > 0 && <StatusBadge status="info">{counts.leave} Leave</StatusBadge>}
              {counts.leave_pending > 0 && <StatusBadge status="neutral">{counts.leave_pending} Pend. Leave</StatusBadge>}
              {counts.absent > 0 && <StatusBadge status="danger">{counts.absent} Absent</StatusBadge>}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-y-auto thin-scrollbar max-h-[320px]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full rounded-[var(--radius)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-secondary">
            {employees.map((emp: TeamAttendanceRecord) => {
              const statusColor = 
                emp.category === 'present' ? 'bg-emerald-500' :
                emp.category === 'late' ? 'bg-amber-500' :
                emp.category === 'leave' ? 'bg-blue-500' :
                emp.category === 'leave_pending' ? 'bg-neutral-400' :
                'bg-red-500';

              return (
                <div key={emp.user_id} className="flex items-center gap-3 p-3 bg-card transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={emp.avatar_url || ''} />
                      <AvatarFallback name={emp.user_name} className="text-[10px]" />
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 ${statusColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {emp.user_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {emp.department_name || 'No Department'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {emp.clock_in && (
                      <p className="text-xs font-mono font-medium">
                        {format(new Date(emp.clock_in), "hh:mm a")}
                      </p>
                    )}
                    {(emp.late_minutes || 0) > 0 && (
                      <p className="text-[10px] text-amber-600 font-bold">
                        {emp.late_minutes}m late
                      </p>
                    )}
                    {emp.category === 'leave' || emp.category === 'leave_pending' ? (
                      <p className="text-[10px] text-blue-600 uppercase tracking-wider">
                        {emp.leave_type ? emp.leave_type.replace('_', ' ') : 'Leave'}
                      </p>
                    ) : null}
                    {emp.category === 'absent' && (
                      <p className="text-[10px] text-red-600 uppercase tracking-wider">
                        Absent
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
