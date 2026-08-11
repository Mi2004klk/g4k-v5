"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

export function AutoNumberingConfig() {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: queryKeys.autoNumberings,
    queryFn: async () => {
      const res = await apiFetch("/auto-numberings");
      return Array.isArray(res) ? res : res.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/auto-numberings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: queryKeys.autoNumberings });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update format");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {records.map((record: any) => (
        <NumberingRow key={record.id} record={record} onSave={(data) => updateMutation.mutate({ id: record.id, data })} isPending={updateMutation.isPending} />
      ))}
    </div>
  );
}

function NumberingRow({ record, onSave, isPending }: { record: any; onSave: (data: any) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({
    prefix: record.prefix || "",
    format: record.format || "",
    start_number: record.current_number ? record.current_number + 1 : record.start_number,
  });

  // Calculate preview
  let preview = formData.format;
  preview = preview.replace('{PREFIX}', formData.prefix);
  if (preview.match(/\{(0+)\}/)) {
    const match = preview.match(/\{(0+)\}/);
    if (match) {
      const paddingLength = match[1].length;
      const paddedNumber = String(formData.start_number).padStart(paddingLength, '0');
      preview = preview.replace(match[0], paddedNumber);
    }
  } else {
    preview = preview.replace('{NUMBER}', String(formData.start_number));
  }

  const handleSave = () => {
    onSave({
      prefix: formData.prefix,
      format: formData.format,
      start_number: formData.start_number,
    });
  };

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-base capitalize">{record.entity_type} ID Format</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Prefix</label>
            <Input 
              value={formData.prefix} 
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value })} 
              className="h-9" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Format</label>
            <Input 
              value={formData.format} 
              onChange={(e) => setFormData({ ...formData, format: e.target.value })} 
              className="h-9 font-mono text-sm" 
              placeholder="{PREFIX}{000}" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Next Start Number</label>
            <Input 
              type="number"
              value={formData.start_number} 
              onChange={(e) => setFormData({ ...formData, start_number: parseInt(e.target.value) || 1 })} 
              className="h-9" 
              min={record.current_number ? record.current_number + 1 : 1}
            />
          </div>
          <div className="flex items-center gap-3 justify-end h-9">
            <div className="text-xs text-neutral-500">
              Preview: <strong className="text-neutral-900 dark:text-white font-mono">{preview}</strong>
            </div>
            <Button onClick={handleSave} disabled={isPending} size="sm" className="gap-2">
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
