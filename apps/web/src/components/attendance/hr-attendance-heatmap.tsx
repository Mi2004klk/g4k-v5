"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, CardHeader, CardTitle, AppIcon, Spinner,
} from "@g4k/ui/components";

export function HrAttendanceHeatmap() {
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.hrAttendanceGraph("date", "yearly", `${year}-01-01`),
    queryFn: () => apiFetch(`/attendance/hr/graph?mode=yearly&groupBy=date&date=${year}-01-01`),
  });

  const heatmapData = useMemo(() => {
    const rawData = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    const map = new Map<string, any>();
    rawData.forEach((item: any) => {
      map.set(item.date, item);
    });
    return map;
  }, [data]);

  // Generate grid for the year (53 columns x 7 rows)
  const grid = useMemo(() => {
    const start = new Date(`${year}-01-01`);
    // adjust to the nearest Sunday
    start.setDate(start.getDate() - start.getDay());
    
    const weeks = [];
    let current = new Date(start);
    
    // We want 53 weeks max
    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split("T")[0];
        
        // Ensure we don't bleed too far into next year
        if (w > 51 && current.getFullYear() > parseInt(year)) {
            // Keep going but we can hide them or leave empty
        }

        week.push({
          date: dateStr,
          inCurrentYear: current.getFullYear() === parseInt(year),
          data: heatmapData.get(dateStr) || null
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      
      if (current.getFullYear() > parseInt(year)) {
        break; // Stop if we moved into next year entirely
      }
    }
    
    return weeks;
  }, [year, heatmapData]);

  // Months labels
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getColor = (dayData: any) => {
    if (!dayData) return "bg-neutral-100 dark:bg-neutral-800/50";
    
    // Total employees for HR's team on that day
    const total = parseInt(dayData.total) || 1;
    const present = parseInt(dayData.present) || 0;
    const late = parseInt(dayData.late) || 0;
    const active = present + late;
    
    if (active === 0) return "bg-neutral-100 dark:bg-neutral-800/50";
    
    const ratio = active / total;
    if (ratio < 0.25) return "bg-emerald-200 dark:bg-emerald-900";
    if (ratio < 0.50) return "bg-emerald-300 dark:bg-emerald-700";
    if (ratio < 0.75) return "bg-emerald-400 dark:bg-emerald-500";
    return "bg-emerald-500 dark:bg-emerald-400";
  };

  return (
    <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl overflow-hidden mt-6">
      <CardHeader className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AppIcon name="chart" className="text-primary" size="sm" />
          Team Attendance Heat Map
        </CardTitle>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28 h-8 text-xs bg-white dark:bg-neutral-950">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(5)].map((_, i) => {
              const y = (new Date().getFullYear() - i).toString();
              return <SelectItem key={y} value={y}>{y}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="p-6 overflow-x-auto">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : (
          <div className="min-w-[800px]">
            <div className="flex text-xs text-neutral-500 dark:text-neutral-400 mb-2 pl-8">
              {months.map((m, i) => (
                <div key={m} className="flex-1" style={{ width: 'calc(100% / 12)' }}>{m}</div>
              ))}
            </div>
            
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 pr-2 text-xs text-neutral-400 dark:text-neutral-500 justify-between py-1">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
              
              {grid.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-1">
                  {week.map((day, dIndex) => (
                    <div 
                      key={`${wIndex}-${dIndex}`}
                      className={`w-3 h-3 rounded-sm ${!day.inCurrentYear ? 'opacity-0' : getColor(day.data)}`}
                      title={day.inCurrentYear ? `${day.date}: ${day.data ? parseInt(day.data.present) + parseInt(day.data.late) : 0} active / ${day.data ? day.data.total : 0} total` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-neutral-500">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-neutral-100 dark:bg-neutral-800/50" />
                <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
                <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
              </div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
