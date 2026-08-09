"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Save } from "lucide-react";

export function PoliciesConfig() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const { data: settingsGrouped, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch("/settings"),
  });

  useEffect(() => {
    if (settingsGrouped?.security) {
      const securityMap: any = {};
      settingsGrouped.security.forEach((s: any) => {
        securityMap[s.key] = s.value;
      });
      setFormData(securityMap);
    }
  }, [settingsGrouped]);

  const updateMutation = useMutation({
    mutationFn: (updates: any[]) =>
      apiFetch("/settings/bulk", {
        method: "POST",
        body: JSON.stringify({ settings: updates }),
      }),
    onSuccess: () => {
      toast.success("Security policies updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = [
      { category: "security", key: "password.min_length", value: formData["password.min_length"]?.toString() || "8" },
      { category: "security", key: "password.require_mixed", value: formData["password.require_mixed"]?.toString() || "true" },
      { category: "security", key: "password.require_number", value: formData["password.require_number"]?.toString() || "true" },
      { category: "security", key: "password.require_symbol", value: formData["password.require_symbol"]?.toString() || "true" },
    ];
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader>
        <CardTitle className="text-base">Password Policy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-medium">Minimum Length</label>
            <input
              type="number"
              min={8}
              max={32}
              className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
              value={formData["password.min_length"] || "8"}
              onChange={(e) => setFormData({ ...formData, "password.min_length": e.target.value })}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_mixed"
              checked={formData["password.require_mixed"] === "true"}
              onChange={(e) => setFormData({ ...formData, "password.require_mixed": e.target.checked ? "true" : "false" })}
            />
            <label htmlFor="require_mixed" className="text-sm">Require uppercase and lowercase letters</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_number"
              checked={formData["password.require_number"] === "true"}
              onChange={(e) => setFormData({ ...formData, "password.require_number": e.target.checked ? "true" : "false" })}
            />
            <label htmlFor="require_number" className="text-sm">Require at least one number</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_symbol"
              checked={formData["password.require_symbol"] === "true"}
              onChange={(e) => setFormData({ ...formData, "password.require_symbol": e.target.checked ? "true" : "false" })}
            />
            <label htmlFor="require_symbol" className="text-sm">Require at least one symbol</label>
          </div>

          <Button type="submit" disabled={updateMutation.isPending} className="mt-4">
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Policy"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
