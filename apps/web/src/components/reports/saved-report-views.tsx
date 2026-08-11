"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, ChevronDown, Check, Trash2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { SheetDescription, Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Popover, PopoverContent, PopoverTrigger } from "@g4k/ui/components";
import { toast } from "sonner";
import { useIsMobile } from "@g4k/ui/hooks";
import { formatDistanceToNow } from "date-fns";
import { queryKeys } from "@/lib/query-keys";

interface SavedReportViewsProps {
  module: string;
  currentFilters: any;
  onApplyFilters: (filters: any) => void;
}

export function SavedReportViews({ module, currentFilters, onApplyFilters }: SavedReportViewsProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();

  const { data: views = [], isLoading } = useQuery({
    queryKey: queryKeys.savedViews(module),
    queryFn: () => apiFetch(`/saved-views?module=${module}`).then(res => res.data || []),
  });

  const saveMutation = useMutation({
    mutationFn: (name: string) => apiFetch(`/saved-views`, {
      method: "POST",
      body: JSON.stringify({ module, name, filters: currentFilters })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews(module) });
      toast.success("View saved successfully");
      setSaveName("");
      setIsSaving(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/saved-views/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews(module) });
      toast.success("View deleted");
    }
  });

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveMutation.mutate(saveName.trim());
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Simple Select implementation for saved views if DropdownMenu is not fully available */}
        <select
          className="h-10 px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100 w-full sm:min-w-[200px]"
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") return;
            const view = views.find((v: any) => v.id.toString() === val);
            if (view && view.filters) {
              onApplyFilters(view.filters);
              toast.info(`Applied view: ${view.name}`);
            }
            e.target.value = "";
          }}
        >
          <option value="">Load saved view...</option>
          {views.map((v: any) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>

        {isMobile ? (
          <Sheet open={isSaving} onOpenChange={setIsSaving}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 shrink-0 whitespace-nowrap">
                <Save className="w-4 h-4 mr-2" />
                Save Current
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader className="mb-4">
                <SheetTitle>Save Report View</SheetTitle>
              </SheetHeader>
              <div className="flex gap-2">
                <Input 
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Name this view..."
                  autoFocus
                  className="flex-1"
                />
                <Button onClick={handleSave} disabled={saveMutation.isPending || !saveName.trim()}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Popover open={isSaving} onOpenChange={setIsSaving}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 shrink-0 whitespace-nowrap">
                <Save className="w-4 h-4 mr-2" />
                Save Current
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[300px] p-3">
              <div className="flex gap-2">
                <Input 
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Name this view..."
                  autoFocus
                  className="flex-1"
                />
                <Button onClick={handleSave} disabled={saveMutation.isPending || !saveName.trim()}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
