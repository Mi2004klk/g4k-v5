"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Button, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Popover, PopoverTrigger, PopoverContent } from "@g4k/ui/components";
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
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews(module) });
      toast.success("View saved successfully");
      setSaveName("");
      setIsSaving(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/saved-views/${id}`, {
      method: "DELETE",
    }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews(module) });
      toast.success("View deleted successfully");
    }
  });

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveMutation.mutate(saveName.trim());
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:min-w-[200px] h-10 justify-between bg-surface text-neutral-500 font-normal">
              Load saved view...
              <AppIcon name="chevronDown" className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full sm:min-w-[200px]">
            {views.length === 0 ? (
              <div className="p-2 text-sm text-neutral-500 italic">No saved views</div>
            ) : (
              views.map((v: SavedReportView) => (
                <div key={v.id} className="flex items-center justify-between group">
                  <DropdownMenuItem
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      if (v.filters) {
                        onApplyFilters(v.filters);
                        toast.info(`Applied view: ${v.name}`);
                      }
                    }}
                  >
                    {v.name}
                  </DropdownMenuItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 mr-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm(`Delete saved view "${v.name}"?`)) {
                        deleteMutation.mutate(v.id);
                      }
                    }}
                  >
                    <AppIcon name="trash" className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
                  {saveMutation.isPending ? <Spinner /> : "Save"}
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
                  {saveMutation.isPending ? <Spinner /> : "Save"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
