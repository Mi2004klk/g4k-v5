import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useReverb } from "./use-reverb";

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
            action: { label: "View Exports", onClick: () => window.location.href = "/dashboard/reports?tab=exports" }
          });
          setIsExporting(false);
        } else if (data.message === "Export queued") {
          toast.success(`Export queued.`, { 
            id: toastId,
            description: "Check the Export history later.",
            action: { label: "View Exports", onClick: () => window.location.href = "/dashboard/reports?tab=exports" }
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
