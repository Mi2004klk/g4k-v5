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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // If not active or on break, we don't tick
    if (!isActive || isOnBreak || !lastActiveTimestamp) {
      return;
    }

    // Initial tick to catch up immediately
    setNow(Date.now());

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive, isOnBreak, lastActiveTimestamp]);

  let displaySeconds = baseSeconds;
  if (isActive && !isOnBreak && lastActiveTimestamp) {
    const elapsed = Math.floor((now - new Date(lastActiveTimestamp).getTime()) / 1000);
    displaySeconds = baseSeconds + Math.max(0, elapsed);
  }

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
