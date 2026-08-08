"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function OrgAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyAttendance = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/attendance/company", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyAttendance();
  }, []);

  const handleExport = () => {
    // Stub Excel Export
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Status,Worked Minutes\n"
      + records.map(r => `${r.name},${r.email},${r.status},${r.total_worked_minutes}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Today's Attendance</h1>
          <p className="text-zinc-400 mt-1">{format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
        <Table>
          <TableHeader className="bg-zinc-900/80">
            <TableRow className="hover:bg-transparent border-zinc-800">
              <TableHead className="text-zinc-400">Employee</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Total Worked</TableHead>
              <TableHead className="text-zinc-400">Overtime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">Loading...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">No records found for today.</TableCell>
              </TableRow>
            ) : records.map((record) => (
              <TableRow key={record.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div className="font-medium text-zinc-200">{record.name}</div>
                  <div className="text-xs text-zinc-500">{record.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    record.status === 'present' ? 'default' :
                    record.status === 'absent' ? 'destructive' :
                    'secondary'
                  }>
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {Math.floor(record.total_worked_minutes / 60)}h {record.total_worked_minutes % 60}m
                </TableCell>
                <TableCell className="text-zinc-300">
                  {Math.floor(record.overtime_minutes / 60)}h {record.overtime_minutes % 60}m
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
