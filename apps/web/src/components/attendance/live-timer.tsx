"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "@/stores/timer-store";

interface LiveTimerProps {
  className?: string;
  render?: (formattedTime: string, displaySeconds: number) => React.ReactNode;
}

export function LiveTimer({ className, render }: LiveTimerProps) {
  const isActive = useTimerStore((s) => s.isActive);
  const isOnBreak = useTimerStore((s) => s.isOnBreak);
  const baseSeconds = useTimerStore((s) => s.baseSeconds);
  const lastActiveTimestamp = useTimerStore((s) => s.lastActiveTimestamp);
  const [displaySeconds, setDisplaySeconds] = useState(baseSeconds);

  useEffect(() => {
    // If not active or on break, static time
    if (!isActive || isOnBreak || !lastActiveTimestamp) {
      setDisplaySeconds(baseSeconds);
      return;
    }

    // Active and ticking
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(lastActiveTimestamp).getTime()) / 1000);
      setDisplaySeconds(baseSeconds + Math.max(0, elapsed));
    };

    // Initial tick to catch up immediately
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, isOnBreak, baseSeconds, lastActiveTimestamp]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formattedTime = formatTime(displaySeconds);

  if (render) {
    return <>{render(formattedTime, displaySeconds)}</>;
  }

  return <span className={className}>{formattedTime}</span>;
}
