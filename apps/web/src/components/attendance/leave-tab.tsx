"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import dynamic from "next/dynamic";
const HolidayCalendar = dynamic(() => import("@/components/leave/holiday-calendar").then(mod => mod.HolidayCalendar), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center border rounded-xl animate-pulse bg-neutral-50 dark:bg-neutral-900" /> });
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { ErrorBoundary } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginatedList } from "@/lib/pagination";
import { ConfirmDialog } from "@g4k/ui/components";

interface LeaveRecord {
  id: number;
  user_id: number;
  user_name?: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export function LeaveTab() {
  const [subTab, setSubTab] = useUrlState("sub", "my-leave");
  const [typeFilter, setTypeFilter] = useUrlState("type", "all");
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [search, setSearch] = useUrlState("search", "");
  const [page, setPage] = useUrlState("page", "1");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isPending } = useQuery({
    queryKey: queryKeys.myLeaveHistory(typeFilter, statusFilter, debouncedSearch, page),
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page);
      return apiFetch(`/leave-requests/history?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/leave-requests/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Leave request cancelled successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.myLeaveHistory(typeFilter, statusFilter, debouncedSearch, page) });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel leave request");
    }
  });

  const paginatedData = usePaginatedList<LeaveRecord>(data);
  const records = paginatedData.data;
  const totalPages = paginatedData.last_page || 1;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const requestDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <ErrorBoundary>
      <Tabs value={subTab} onValueChange={setSubTab} className="w-full mt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="my-leave" className="data-[state=active]:text-amber-600 data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/30">My Leave</TabsTrigger>
          <TabsTrigger value="holidays" className="data-[state=active]:text-amber-600 data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/30">Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="my-leave" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column: Request Form */}
            <div className="w-full md:w-1/3 flex flex-col min-h-[400px]">
              <LeaveRequestForm />
            </div>

            {/* Right Column: History */}
            <div className="flex-1 flex flex-col min-w-0 min-h-[500px]">
              <LeaveHistoryTable 
                records={records as any} 
                isLoading={isPending} 
                page={parseInt(page)}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p.toString())}
                onDeleteAction={requestDelete}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="holidays">
          <div className="max-w-4xl min-h-[600px]">
            <HolidayCalendar />
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel Leave Request"
        description="Are you sure you want to cancel this leave request? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmText="Cancel Leave"
        variant="destructive"
        isPending={deleteMutation.isPending}
      />
    </ErrorBoundary>
  );
}
