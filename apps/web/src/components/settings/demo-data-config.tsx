"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@g4k/ui/components";
import { toast } from "sonner";
import { useState } from "react";
import { AppIcon } from "@g4k/ui/components";

export function DemoDataConfig() {
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["demo-data-status"],
    queryFn: async () => {
      const res = await apiFetch("/demo-data");
      return res.data;
    }
  });

  const purgeMutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/demo-data/purge", { method: "DELETE", body: JSON.stringify({ confirmation: confirmText }) });
    },
    onSuccess: () => {
      toast.success("Demo purge job dispatched. Data will be removed shortly.");
      setConfirmText("");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["demo-data-status"] }), 3000);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to purge demo data");
    }
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/demo-data/seed", { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Demo seed job dispatched. Data will be seeded shortly.");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["demo-data-status"] }), 3000);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to seed demo data");
    }
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-neutral-500 animate-pulse">Loading demo data status...</div>;
  }

  const counts = data?.counts || {};
  const hasDemoData = Object.values(counts).some((count: unknown) => Number(count) > 0);

  return (
    <div className="space-y-6">
      <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1">
        <CardHeader>
          <CardTitle className="text-base text-red-600 dark:text-red-400 flex items-center gap-2">
            <AppIcon name="warning" className="w-5 h-5" />
            Demo Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-[var(--radius)]">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Danger Zone</h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              This will permanently remove ALL demo data — users, departments, projects, tasks, attendance records, leave requests, chats, notifications, settings, and uploaded files. The app will be completely clean for fresh production setup.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Current Demo Data Status: {data?.version ? `Seeded (${data.version})` : 'Not Seeded'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(counts).map(([table, count]: [string, unknown]) => (
                <div key={table} className="border border-neutral-200 dark:border-neutral-800 rounded-[var(--radius)] p-3">
                  <div className="text-xs text-neutral-500 capitalize">{table.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-white">{String(count)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            {hasDemoData ? (
              <div className="space-y-3 max-w-sm">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Type <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-red-600">REMOVE DEMO DATA</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2"
                  placeholder="REMOVE DEMO DATA"
                />
                <Button 
                  variant="destructive" 
                  disabled={confirmText !== "REMOVE DEMO DATA" || purgeMutation.isPending}
                  onClick={() => purgeMutation.mutate()}
                  className="w-full"
                >
                  {purgeMutation.isPending ? "Purging..." : "Remove Demo Data"}
                </Button>
              </div>
            ) : (
              <div>
                <Button 
                  variant="outline"
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                >
                  {seedMutation.isPending ? "Seeding..." : "Re-seed Demo Data"}
                </Button>
                <p className="text-xs text-neutral-500 mt-2">
                  This will re-run the demo seeder and populate the database with dummy data for training and support purposes.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
