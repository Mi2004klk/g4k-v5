"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MetricWidgetProps {
  title: string;
  metricKey: string;
  endpoint: string;
  icon?: React.ElementType;
  className?: string;
}

export function MetricWidget({ title, metricKey, endpoint, icon: Icon, className }: MetricWidgetProps) {
  const [value, setValue] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetric = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setValue(data.metrics?.[metricKey] ?? 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetric();
  }, [endpoint, metricKey]);

  return (
    <div className={cn("w-full h-full flex flex-col p-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors cursor-move", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
      </div>
      <div className="flex-1 flex items-end">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        ) : (
          <div className="text-3xl font-bold text-white tracking-tight">
            {value}
          </div>
        )}
      </div>
    </div>
  );
}
