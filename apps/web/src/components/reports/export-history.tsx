"use client";
import { useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { useReverb } from "@/hooks/use-reverb";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

export function ExportHistory() {
  const queryClient = useQueryClient();
  const { subscribe, leaveChannel } = useReverb();
  
  useEffect(() => {
    const channelName = "exports";
    const channel = subscribe(channelName);
    if (channel) {
      channel.listen(".ExportCompleted", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.exportHistory });
      });
    }

    return () => {
      if (channel) {
        channel.stopListening(".ExportCompleted");
      }
      leaveChannel(channelName);
    };
  }, [subscribe, leaveChannel, queryClient]);

  const { data: exports = [], isLoading } = useQuery({
    queryKey: queryKeys.exportHistory,
    queryFn: () => apiFetch("/reports/exports"),
  });

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-600" />
          Export Job Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading exports...
          </div>
        ) : exports.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">No export history found.</p>
        ) : (
          exports.slice(0, 3).map((item: any) => (
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
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  )}
                  {item.status === "processing" && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing
                    </span>
                  )}
                  {item.status === "failed" && (
                    <span className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold">
                      <AlertCircle className="w-3 h-3" /> Failed
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
                  asChild
                  className="h-7 text-[11px] gap-1"
                >
                  <a href={item.file_path} target="_blank" rel="noreferrer">
                    <Download className="w-3 h-3" /> Download
                  </a>
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
