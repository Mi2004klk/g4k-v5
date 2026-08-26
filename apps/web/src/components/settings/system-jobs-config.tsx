"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, AppIcon } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { format } from "date-fns";

export function SystemJobsConfig() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin_jobs"],
    queryFn: () => apiFetch<any>("/admin/jobs"),
    refetchInterval: 10000, // poll every 10s
  });

  const retryMutation = useMutation({
    mutationFn: (id: string = "all") => apiFetch("/admin/jobs/retry", { method: "POST", body: JSON.stringify({ id }) }),
    onSuccess: (_, id) => {
      toast.success(id === "all" ? "All failed jobs queued for retry." : `Job ${id} queued for retry.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminJobs });
    },
    onError: () => toast.error("Failed to retry jobs."),
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-neutral-500">Loading jobs...</div>;
  }

  const { pending_count = 0, failed_count = 0, failed_jobs = [] } = data || {};

  return (
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">System Background Jobs</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => retryMutation.mutate("all")} 
          disabled={failed_count === 0 || retryMutation.isPending}
        >
          {retryMutation.isPending ? <AppIcon name="loading" className="animate-spin mr-2" /> : <AppIcon name="refresh" className="mr-2" />}
          Retry All Failed
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-[var(--radius)] flex flex-col">
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Pending Jobs</span>
            <span className="text-2xl font-bold">{pending_count}</span>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-[var(--radius)] flex flex-col">
            <span className="text-xs text-rose-500 font-semibold uppercase tracking-wider mb-1">Failed Jobs</span>
            <span className="text-2xl font-bold text-rose-600">{failed_count}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Failed Jobs</h3>
          {failed_jobs.length === 0 ? (
            <div className="text-sm text-neutral-500 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-[var(--radius)] text-center">
              No failed jobs.
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto thin-scrollbar pr-2">
              {failed_jobs.map((job: any) => (
                <div key={job.id} className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-[var(--radius)] text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-rose-600 break-all pr-4">{job.queue}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-neutral-500">{format(new Date(job.failed_at), "MMM d, yyyy HH:mm:ss")}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-primary-600" onClick={() => retryMutation.mutate(job.id)}>
                        <AppIcon name="refresh" size="sm" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 font-mono text-[10px] break-all">
                    {(() => {
                      try {
                        return job.payload ? JSON.parse(job.payload).displayName : "Unknown payload";
                      } catch (e) {
                        return "Invalid payload format";
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
