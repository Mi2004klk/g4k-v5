"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Switch,
  Spinner,
  AppIcon,
} from "@g4k/ui/components";

interface LeaveTypeConfig {
  id: number;
  key: string;
  label: string;
  default_allowed: number;
  is_active: boolean;
  sort_order: number;
}

export function LeaveTypesConfig() {
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState({ key: "", label: "", default_allowed: 12 });

  const { data: configs, isLoading } = useQuery<LeaveTypeConfig[]>({
    queryKey: ["leave-type-configs"],
    queryFn: () => apiFetch("/leave-type-configs"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return apiFetch(`/leave-type-configs/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-type-configs"] });
      toast.success("Leave type updated");
    },
    onError: () => toast.error("Failed to update leave type"),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/leave-type-configs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-type-configs"] });
      setNewType({ key: "", label: "", default_allowed: 12 });
      toast.success("Leave type created");
    },
    onError: () => toast.error("Failed to create leave type"),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.key || !newType.label) return;
    createMutation.mutate(newType);
  };

  const getLeaveIcon = (val: string) => {
    switch (val) {
      case 'casual': return 'leave';
      case 'sick': return 'plus';
      case 'earned': return 'award';
      case 'unpaid': return 'minus';
      default: return 'file';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-e2 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
              <AppIcon name="settings" size="sm" />
            </div>
            Leave Types Configuration
          </CardTitle>
          <CardDescription>Configure available leave categories, defaults, and active status.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Array.isArray(configs) ? configs : (configs as any)?.data || []).map((config: any) => (
                <div key={config.id} className={`flex flex-col p-4 rounded-xl border transition-all duration-200 ${config.is_active ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-primary-300 dark:hover:border-primary-700/50' : 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-100 dark:border-neutral-800/50 opacity-70 grayscale'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${config.is_active ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800'}`}>
                        <AppIcon name={getLeaveIcon(config.key) as any} size="sm" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white leading-tight">{config.label}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 font-mono">{config.key}</p>
                      </div>
                    </div>
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={(checked) => updateMutation.mutate({ id: config.id, payload: { is_active: checked } })}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/60 mt-auto">
                    <Label className="text-xs text-neutral-500">Annual Default Allowance</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 h-8 text-center text-sm font-semibold bg-neutral-50 dark:bg-neutral-900"
                        value={config.default_allowed}
                        onChange={(e) => updateMutation.mutate({ id: config.id, payload: { default_allowed: parseFloat(e.target.value) } })}
                      />
                      <span className="text-xs text-neutral-500">days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <AppIcon name="plus" size="sm" className="text-neutral-400" />
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Add New Leave Type</h3>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row items-start md:items-end gap-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div className="space-y-1.5 flex-1 w-full">
                <Label className="text-xs font-semibold text-neutral-600">System Key</Label>
                <Input
                  value={newType.key}
                  onChange={(e) => setNewType({ ...newType, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="e.g. bereavement"
                  className="bg-white dark:bg-neutral-950"
                />
              </div>
              <div className="space-y-1.5 flex-1 w-full">
                <Label className="text-xs font-semibold text-neutral-600">Display Name</Label>
                <Input
                  value={newType.label}
                  onChange={(e) => setNewType({ ...newType, label: e.target.value })}
                  placeholder="e.g. Bereavement Leave"
                  className="bg-white dark:bg-neutral-950"
                />
              </div>
              <div className="space-y-1.5 w-full md:w-32">
                <Label className="text-xs font-semibold text-neutral-600">Default Days</Label>
                <Input
                  type="number"
                  value={newType.default_allowed}
                  onChange={(e) => setNewType({ ...newType, default_allowed: parseFloat(e.target.value) })}
                  className="bg-white dark:bg-neutral-950 text-center"
                />
              </div>
              <Button type="submit" disabled={!newType.key || !newType.label || createMutation.isPending} className="w-full md:w-auto mt-2 md:mt-0">
                {createMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <AppIcon name="plus" size="sm" className="mr-2" />}
                Add Type
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
