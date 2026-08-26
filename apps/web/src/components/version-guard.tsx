"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function VersionGuard() {
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const checkVersion = async () => {
      try {
        const res = await fetch("/api/frontend-version");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.buildId) {
          if (!currentBuildId) {
            setCurrentBuildId(data.buildId);
          } else if (currentBuildId !== data.buildId) {
            toast.info("A new version of Games4King Workplace OS is available!", {
              description: "Click reload to load the latest features.",
              action: {
                label: "Reload Now",
                onClick: () => window.location.reload(),
              },
            });
          }
        }
      } catch {
        // Silent catch
      }
    };

    checkVersion();
    intervalId = setInterval(checkVersion, 60000);

    return () => clearInterval(intervalId);
  }, [currentBuildId]);

  return null;
}
