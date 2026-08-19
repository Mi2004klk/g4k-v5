"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { toast } from "sonner";
import { useIsMobile } from "@g4k/ui/hooks";
import { queryKeys } from "@/lib/query-keys";

export interface SavedReportView {
  id: number;
  name: string;
  module: string;
  filters: Record<string, unknown>;
}

interface SavedReportViewsProps {
  module: string;
  currentFilters: Record<string, unknown>;
  onApplyFilters: (filters: Record<string, unknown>) => void;
}

export function SavedReportViews({ module, currentFilters, onApplyFilters }: SavedReportViewsProps) {
  const queryClient = useQueryClient();
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();

  const { data: views = [] } = useQuery({
    queryKey: queryKeys.savedViews(module),
    queryFn: () => apiFetch(`/saved-views?module=${module}`).then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : [])))),
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

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveMutation.mutate(saveName.trim());
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Simple Select implementation for saved views if DropdownMenu is not fully available */}
        <Select
          value=""
          onValueChange={(val) => {
            if (!val) return;
            const view = views.find((v: SavedReportView) => v.id.toString() === val);
            if (view && view.filters) {
              onApplyFilters(view.filters);
              toast.info(`Applied view: ${view.name}`);
            }
          }}
        >
          <SelectTrigger className="w-full sm:min-w-[200px] h-10 bg-surface">
            <SelectValue placeholder="Load saved view..." />
          </SelectTrigger>
          <SelectContent>
            {views.map((v: SavedReportView) => (
              <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isMobile ? (
          <Sheet open={isSaving} onOpenChange={setIsSaving}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 shrink-0 whitespace-nowrap">
                <AppIcon name="save" className=" mr-2" />
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
                  {saveMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Save"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Popover open={isSaving} onOpenChange={setIsSaving}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 shrink-0 whitespace-nowrap">
                <AppIcon name="save" className=" mr-2" />
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
                  {saveMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Save"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
