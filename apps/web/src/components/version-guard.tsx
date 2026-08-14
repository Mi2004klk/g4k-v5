"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";

export function VersionGuard() {
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: any;

    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.buildId) {
          if (!currentBuildId) {
            setCurrentBuildId(data.buildId);
          } else if (currentBuildId !== data.buildId) {
            toast.info("A new version of Games4King Workplace OS is available!", {
              description: "Click reload to load the latest features.",
              duration: Infinity,
              action: {
                label: "Reload Now",
                onClick: () => window.location.reload(),
              },
            });
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        // Silent catch
      }
    };

    checkVersion();
    intervalId = setInterval(checkVersion, 60000);

    return () => clearInterval(intervalId);
  }, [currentBuildId]);

  return null;
}
