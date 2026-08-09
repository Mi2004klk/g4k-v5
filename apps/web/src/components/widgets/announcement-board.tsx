"use client";

import { useQuery } from "@tanstack/react-query";
import { Megaphone, Pin } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";

export function AnnouncementBoard() {
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiFetch("/announcements"),
  });

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-violet-600" />
          Company Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
        {announcements.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">No announcements yet.</p>
        ) : (
          announcements.map((item: any) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5 border border-neutral-100 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  {item.pinned_at && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  {item.title}
                </h4>
                <span className="text-[10px] text-neutral-400">
                  {format(new Date(item.created_at), "MMM d")}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {item.body}
              </p>
              <div className="text-[10px] text-neutral-400 font-medium">
                Posted by {item.creator?.name || "Management"}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
