import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useReverb } from "./use-reverb";

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);
  const { subscribe } = useReverb();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      downloadUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [downloadUrls]);

  const triggerExport = useCallback(
    async (endpoint: string, filename: string) => {
      setIsExporting(true);
      const toastId = toast.loading(`Generating export for ${filename}...`);
      
      try {
        // 1. Send POST request to queue the export
        const response = await apiFetch(endpoint, {
          method: "POST",
        });

        // If backend does immediate mock return for now (before real Queue is ready):
        if (response instanceof Blob) {
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

        const data = await response.json().catch(() => ({}));

        if (data.job_id) {
          toast.loading(`Export queued (Job ${data.job_id}). We will notify you when it is ready.`, { id: toastId });
          
          // 2. Ideally, listen to reverb channel for this user/job
          // const channel = subscribe(`private-exports.${data.job_id}`);
          // channel?.listen('.export.ready', (e: any) => { ... download ... });
          
          // Mocking the completion for frontend demo
          setTimeout(() => {
            toast.success(`Export ${filename} is ready to download!`, {
              id: toastId,
              action: {
                label: "Download",
                onClick: () => {
                  // create dummy blob
                  const blob = new Blob(["dummy data"], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  setDownloadUrls((prev) => [...prev, url]);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
              }
            });
            setIsExporting(false);
          }, 3000);
        } else {
          toast.success(`Export completed.`, { id: toastId });
          setIsExporting(false);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to start export.", { id: toastId });
        setIsExporting(false);
      }
    },
    []
  );

  return { triggerExport, isExporting };
}
