"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Bell, Check, CircleAlert, CheckCircle2, MessageSquare, Briefcase, MailOpen } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<{ readStatus: string; type: string }>({
    readStatus: "all",
    type: "all"
  });

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-full", page, filter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (filter.readStatus === "unread") params.set("unreadOnly", "true");
      return apiFetch(`/notifications?${params.toString()}`);
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-full"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] }); // update bell
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/notifications/mark-all-read`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications-full"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "leave_decision":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "task_assigned":
        return <Briefcase className="w-4 h-4 text-violet-500" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "security":
        return <CircleAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <CircleAlert className="w-4 h-4 text-amber-500" />;
    }
  };

  const columns = [
    {
      header: "Type",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {getIcon(row.type)}
          <span className="capitalize text-xs font-medium">{row.type.replace("_", " ")}</span>
        </div>
      )
    },
    {
      header: "Notification",
      cell: (row: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {row.link ? (
              <Link href={row.link} className={`text-sm hover:underline hover:text-violet-600 dark:hover:text-violet-400 ${!row.read_at ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                {row.title}
              </Link>
            ) : (
              <span className={`text-sm ${!row.read_at ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                {row.title}
              </span>
            )}
            {row.priority === 'urgent' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">Urgent</span>
            )}
          </div>
          <span className="text-xs text-neutral-500 mt-1">{row.body}</span>
        </div>
      )
    },
    {
      header: "Received",
      cell: (row: any) => (
        <div className="flex flex-col text-xs text-neutral-500">
          <span>{formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}</span>
          <span className="text-[10px] text-neutral-400">{format(new Date(row.created_at), 'MMM d, yyyy h:mm a')}</span>
        </div>
      )
    },
    {
      header: "Actions",
      cell: (row: any) => (
        <div className="flex justify-end">
          {!row.read_at ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markReadMutation.mutate(row.id)}
              disabled={markReadMutation.isPending}
              className="text-xs"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark Read
            </Button>
          ) : (
            <span className="text-xs text-neutral-400 flex items-center">
              <MailOpen className="w-4 h-4 mr-1" /> Read
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <PageContainer
      title="Notifications"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark all as read
        </Button>
      }
    >
      <div className="mb-6">
        <FilterBar
          searchQuery=""
          onSearchChange={() => {}}
          filters={[
            {
              key: "readStatus",
              label: "Status",
              type: "select",
              options: [
                { label: "All", value: "all" },
                { label: "Unread", value: "unread" }
              ],
              value: filter.readStatus,
              onChange: (v) => setFilter(f => ({ ...f, readStatus: v }))
            }
          ]}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8 text-neutral-500">Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
        />
      )}
      
      {/* Basic Pagination (assume standard Laravel pagination response) */}
      {data?.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-xs text-neutral-500">
            Page {data.current_page} of {data.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
            disabled={page === data?.last_page}
          >
            Next
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
