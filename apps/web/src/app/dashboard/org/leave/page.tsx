"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function OrgLeaveApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

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

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave/${id}/${action}`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        toast.success(`Leave request ${action}d successfully`);
        fetchRequests();
      } else {
        toast.error(`Failed to ${action} leave request`);
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Leave Approvals</h1>
      
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">All Company Requests</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Employee</TableHead>
              <TableHead className="text-zinc-400">Leave Details</TableHead>
              <TableHead className="text-zinc-400">Reason</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-zinc-500">Loading...</TableCell></TableRow>
            ) : requests.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-zinc-500">No requests found.</TableCell></TableRow>
            ) : requests.map((req) => (
              <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div className="font-medium text-zinc-200">{req.user_name}</div>
                  <div className="text-xs text-zinc-500">{req.user_email}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-zinc-300 capitalize">{req.leave_type}</div>
                  <div className="text-sm text-zinc-500">
                    {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d')}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm max-w-[200px] truncate">
                  {req.reason || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {req.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAction(req.id, 'reject')}
                        disabled={processing === req.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border-red-900/50"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleAction(req.id, 'approve')}
                        disabled={processing === req.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
