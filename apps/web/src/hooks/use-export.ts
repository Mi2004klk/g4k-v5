import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { usePusher } from "./use-pusher";
import { useAuthStore } from "@/lib/auth-store";

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      downloadUrls.forEach((url) => {
        // eslint-disable-next-line no-restricted-syntax
        URL.revokeObjectURL(url);
      });
    };
  }, [downloadUrls]);

  const { subscribe } = usePusher();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (!user?.id) return;
    
    const channel = subscribe(`private-user.${user.id}`);
    if (!channel) return;

    channel.listen(".export-completed", (e: any) => {
      const job = e.exportJob;
      if (job && job.status === "completed" && job.file_path) {
        toast.success(`Export ${job.report_key} is ready.`, {
          description: "Click to view your exports.",
          action: { label: "View Exports", onClick: () => window.location.href = "/dashboard/reports?tab=general" },
          duration: 10000,
        });
      } else if (job && job.status === "failed") {
        toast.error(`Export ${job.report_key} failed.`, {
          description: job.error_message || "An unknown error occurred.",
          duration: 10000,
        });
      }
    });

    return () => {
      // ReverbContext manages unsubscription when component unmounts
    };
  }, [user?.id, subscribe]);

  const triggerExport = useCallback(
    async (endpoint: string, filename: string, options?: RequestInit) => {
      setIsExporting(true);
      const toastId = toast.loading(`Generating export for ${filename}...`);
      
      try {
        const fetchOptions = {
          method: "GET",
          ...options
        };
        const response = await apiFetch(endpoint, fetchOptions);

        // If backend does immediate mock return for now (before real Queue is ready):
        if (response instanceof Blob) {
          // eslint-disable-next-line no-restricted-syntax
          const url = URL.createObjectURL(response);
          setDownloadUrls((prev) => [...prev, url]);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success(`Export ${filename} ready.`, { id: toastId });
          setIsExporting(false);
          return;
        }

        // apiFetch already parses the JSON if it's not a Blob
        const data = response;

        if (data.job_id) {
          toast.success(`Export queued (Job ${data.job_id}).`, { 
            id: toastId,
            description: "Check the Export history later.",
            action: { label: "View Exports", onClick: () => window.location.href = "/dashboard/reports?tab=general" }
          });
          setIsExporting(false);
        } else if (data.message === "Export queued") {
          toast.success(`Export queued.`, { 
            id: toastId,
            description: "Check the Export history later.",
            action: { label: "View Exports", onClick: () => window.location.href = "/dashboard/reports?tab=general" }
          });
          setIsExporting(false);
        } else {
          toast.success(`Export completed.`, { id: toastId });
          setIsExporting(false);
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to start export.", { id: toastId });
        setIsExporting(false);
      }
    },
    []
  );

  return { triggerExport, isExporting };
}
