"use client";
import { useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { format } from "date-fns";

export interface ExportJob {
  id: number;
  report_key: string;
  format: string;
  status: string;
  file_path?: string;
  created_at: string;
  error?: string;
}
import { apiFetch } from "@/lib/api-client";
import { useReverb } from "@/hooks/use-reverb";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

import { useState as useStateLocal } from "react";

export function ExportHistory() {
  const [showAll, setShowAll] = useStateLocal(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { subscribe, leaveChannel } = useReverb();
  
  useEffect(() => {
    if (!user?.id) return;
    
    const channelName = `user.${user.id}`;
    const channel = subscribe(channelName, true);
    if (channel) {
      channel.listen(".export-completed", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.exportHistory });
      });
    }

    return () => {
      if (channel) {
        channel.stopListening(".export-completed");
      }
      leaveChannel(channelName);
    };
  }, [subscribe, leaveChannel, queryClient, user?.id]);

  const { data: exports = [], isLoading } = useQuery({
    queryKey: queryKeys.exportHistory,
    queryFn: () => apiFetch("/reports/exports").then(res => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))),
    refetchInterval: (query) => {
      const currentData = query.state.data as ExportJob[] | undefined;
      const isProcessing = currentData?.some((e) => e.status === "processing");
      return isProcessing ? 5000 : false;
    }
  });

  const handleDownload = async (item: ExportJob) => {
    try {
        const url = `/reports/exports/${item.id}/download`;
        const blob = await apiFetch(url, { method: "GET" }) as Blob;
        
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `export-${item.report_key}-${item.id}.${item.format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objectUrl);
      } catch (e) {
      toast.error("Failed to download export file. It may be expired or inaccessible.");
    }
  };

  return (
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AppIcon name="teamAttendance" className=" text-primary-600" />
          Export Job Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-neutral-400">
            <AppIcon name="loading" className=" animate-spin mr-2" /> Loading exports...
          </div>
        ) : exports.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">No export history found.</p>
        ) : (
          
          <div className="space-y-3">
            {exports.slice(0, showAll ? undefined : 3).map((item: ExportJob) => (

            <div
              key={item.id}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between gap-3 border border-neutral-100 dark:border-neutral-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-neutral-900 dark:text-white">
                    {item.report_key} ({item.format})
                  </span>
                  {item.status === "completed" && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                      <AppIcon name="success" size="xs" /> Ready
                    </span>
                  )}
                  {item.status === "processing" && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                      <AppIcon name="loading" size="xs" className=" animate-spin" /> Processing
                    </span>
                  )}
                  {item.status === "failed" && (
                    <span className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold" title={item.error || "Job failed"}>
                      <AppIcon name="error" size="xs" /> Failed
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  Requested {format(new Date(item.created_at), "MMM d, h:mm a")}
                </div>
              </div>

              {item.file_path && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(item)}
                  className="h-7 text-[11px] gap-1"
                >
                  <AppIcon name="download" size="xs" /> Download
                </Button>
              )}
            </div>

            ))}
          </div>

        )}
        {exports.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-neutral-500"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : `View All (${exports.length})`}
          </Button>
        )}
      </CardContent>

    </Card>
  );
}
