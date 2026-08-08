"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Play, Square, Coffee } from "lucide-react";
import { toast } from "sonner";

interface TimeClockWidgetProps {
  className?: string;
}

export function TimeClockWidget({ className }: TimeClockWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<'not_started' | 'active' | 'on_break' | 'completed'>('not_started');
  const [totalSeconds, setTotalSeconds] = useState(0);

  const fetchState = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/attendance/today", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setTotalSeconds(data.total_worked_seconds || 0);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load attendance state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Live timer tick
  useEffect(() => {
    if (state !== 'active') return;
    const interval = setInterval(() => {
      setTotalSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const handlePunch = async (type: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/attendance/clock", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setTotalSeconds(data.total_worked_seconds);
        toast.success(`Action: ${type.replace('_', ' ')} recorded`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to record punch. Will sync when online.");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={cn("w-full h-full flex flex-col p-4 bg-zinc-900 border border-zinc-800 rounded-xl cursor-move", className)}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full flex flex-col p-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-move hover:border-zinc-700 transition-colors", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-zinc-400">Time Clock</h3>
        <div className={cn(
          "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full",
          state === 'active' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
          state === 'on_break' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
          state === 'completed' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
          "bg-zinc-800 text-zinc-500"
        )}>
          {state.replace('_', ' ')}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="text-4xl font-mono font-bold tracking-tight text-white mb-4 tabular-nums">
          {formatTime(totalSeconds)}
        </div>
        
        <div className="flex gap-2">
          {state === 'not_started' && (
            <button onClick={() => handlePunch('CLOCK_IN')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Play className="w-4 h-4" /> Clock In
            </button>
          )}
          {state === 'active' && (
            <>
              <button onClick={() => handlePunch('BREAK_START')} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors">
                <Coffee className="w-4 h-4" /> Break
              </button>
              <button onClick={() => handlePunch('CLOCK_OUT')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Square className="w-4 h-4" /> Clock Out
              </button>
            </>
          )}
          {state === 'on_break' && (
            <button onClick={() => handlePunch('BREAK_END')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Play className="w-4 h-4" /> Resume Work
            </button>
          )}
          {state === 'completed' && (
            <div className="text-sm text-zinc-500">Shift completed</div>
          )}
        </div>
      </div>
    </div>
  );
}
