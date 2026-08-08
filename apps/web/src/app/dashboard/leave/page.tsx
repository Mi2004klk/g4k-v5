"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MyLeavePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simple form state
  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/leave", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/leave", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason
        })
      });
      if (res.ok) {
        toast.success("Leave request submitted successfully");
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchRequests();
      } else {
        toast.error("Failed to submit leave request");
      }
    } catch (e) {
      toast.error("Network error. Will sync when online.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Leave Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Request Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Leave Type</label>
                <select 
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="personal">Personal Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Start Date</label>
                  <input type="date" required value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">End Date</label>
                  <input type="date" required value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Reason</label>
                <textarea 
                  value={reason} onChange={e=>setReason(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 h-24 resize-none"
                  placeholder="Optional details..."
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Leave History</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Type</TableHead>
                  <TableHead className="text-zinc-400">Dates</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-zinc-500">Loading...</TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-zinc-500">No leave requests found.</TableCell></TableRow>
                ) : requests.map((req) => (
                  <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-zinc-200 capitalize">{req.leave_type}</TableCell>
                    <TableCell className="text-zinc-300">
                      {format(new Date(req.start_date), 'MMM d, yyyy')} - {format(new Date(req.end_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {format(new Date(req.created_at), 'MMM d')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
