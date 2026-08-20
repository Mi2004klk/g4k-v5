"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { useReverb } from "@/hooks/use-reverb";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardHeader, CardTitle, CardContent, EmptyState, Badge, Button } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export interface ExportJob {
  id: number;
  report_key: string;
  format: string;
  status: string;
  file_path?: string;
  created_at: string;
  error?: string;
}

export function ExportHistory() {
  const [showAll, setShowAll] = useState(false);
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
      const isProcessing = currentData?.some((e) => e.status === "processing" || e.status === "pending");
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
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-900/30">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AppIcon name="clock" className="text-primary-600 dark:text-primary-400" />
          Export Job Queue
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-neutral-400 space-y-3">
            <AppIcon name="loading" size="lg" className="animate-spin text-primary-500" /> 
            <span className="text-sm">Loading queue...</span>
          </div>
        ) : exports.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <EmptyState
              icon="fileText"
              title="No exports yet"
              description="Your data export jobs will appear here."
              className="py-8"
            />
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-auto pr-1 -mr-1">
            {exports.slice(0, showAll ? undefined : 4).map((item: ExportJob) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200/60 dark:border-neutral-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className="text-sm font-semibold truncate text-neutral-900 dark:text-white">
                      {item.report_key.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 h-5 font-mono uppercase bg-neutral-50 dark:bg-neutral-900">
                      {item.format}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    {item.status === "completed" && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                        <AppIcon name="success" size="xs" /> Ready
                      </span>
                    )}
                    {item.status === "processing" && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">
                        <AppIcon name="loading" size="xs" className="animate-spin" /> Processing
                      </span>
                    )}
                    {item.status === "failed" && (
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded" title={item.error || "Job failed"}>
                        <AppIcon name="error" size="xs" /> Failed
                      </span>
                    )}
                    <span className="text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                      {format(new Date(item.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>

                {item.file_path && (
                  <Button
                    size="sm"
                    onClick={() => handleDownload(item)}
                    className="h-8 text-xs shrink-0 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 shadow-none border-none group-hover:bg-primary-600 group-hover:text-white transition-colors"
                  >
                    <AppIcon name="download" size="xs" className="mr-1.5" /> 
                    Download
                  </Button>
                )}
              </div>
            ))}
            
            {exports.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <><AppIcon name="chevronUp" size="xs" className="mr-1.5" /> Show Less</>
                ) : (
                  <><AppIcon name="chevronDown" size="xs" className="mr-1.5" /> View All ({exports.length})</>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
