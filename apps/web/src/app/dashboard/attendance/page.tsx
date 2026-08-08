"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/attendance/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      }
    };
    fetchHistory();
  }, []);

  // Simple visual representation of a heatmap
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-500';
      case 'late': return 'bg-amber-500';
      case 'absent': return 'bg-red-500';
      case 'on_leave': return 'bg-blue-500';
      default: return 'bg-zinc-800';
    }
  };

  const today = new Date();
  const pastDays = Array.from({ length: 90 }).map((_, i) => format(subDays(today, 89 - i), 'yyyy-MM-dd'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">My Attendance</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <h2 className="text-lg font-medium text-white mb-6">Activity Heatmap (Last 90 Days)</h2>
        <div className="flex flex-wrap gap-2">
          {pastDays.map(dateStr => {
            const record = records.find(r => r.date === dateStr);
            return (
              <div 
                key={dateStr}
                title={`${dateStr}: ${record?.status || 'No data'}`}
                className={`w-4 h-4 rounded-sm ${getStatusColor(record?.status)} hover:ring-2 ring-white/20 transition-all cursor-help`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-6 text-xs text-zinc-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-zinc-800"></div> No data</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Present</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-500"></div> Late</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500"></div> Absent</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div> Leave</div>
        </div>
      </div>
    </div>
  );
}
