"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhaseCard } from "./phase-card";
import { PhaseManageDialog } from "./phase-manage-dialog";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

export interface PhaseTimelineProps {
  projectId: string;
  phases: any[];
  canManage: boolean;
  onTaskClick: (taskId: number) => void;
  onAddTask: (phaseId?: number) => void;
}

export function PhaseTimeline({ projectId, phases: initialPhases, canManage, onTaskClick, onAddTask }: PhaseTimelineProps) {
  const queryClient = useQueryClient();
  const [phases, setPhases] = useState(initialPhases);
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>(
    // By default, expand the active phase or the first phase
    initialPhases.reduce((acc, phase, i) => {
      acc[phase.id] = phase.status === 'active' || (i === 0 && !initialPhases.find(p => p.status === 'active'));
      return acc;
    }, {} as Record<number, boolean>)
  );
  
  const [manageDialog, setManageDialog] = useState<{ isOpen: boolean; phase?: any }>({ isOpen: false });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = (phaseId: number) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const reorderMutation = useMutation({
    mutationFn: async (reorderedPhases: any[]) => {
      const payload = {
        phases: reorderedPhases.map((p, index) => ({ id: p.id, sort_order: index + 1 }))
      };
      return apiFetch(`/projects/${projectId}/phases/reorder`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: [...queryKeys.project(projectId), "phases"] });
    },
    onError: () => {
      toast.error("Failed to save phase order");
      setPhases(initialPhases); // revert
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPhases((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        reorderMutation.mutate(newArray);
        return newArray;
      });
    }
  };

  const statusMutation = useMutation({
    mutationFn: async ({ phaseId, action }: { phaseId: number, action: 'complete' | 'reopen' | 'delete' }) => {
      if (action === 'delete') {
        return apiFetch(`/projects/${projectId}/phases/${phaseId}`, { method: "DELETE" });
      }
      return apiFetch(`/projects/${projectId}/phases/${phaseId}/${action}`, { method: "POST" });
    },
    onSuccess: (_, vars) => {
      if (isQueued(_)) return;
      if (vars.action === 'delete') toast.success("Phase deleted");
      else if (vars.action === 'complete') toast.success("Phase marked completed");
      else toast.success("Phase reopened");
      queryClient.invalidateQueries({ queryKey: [...queryKeys.project(projectId), "phases"] });
    },
    onError: (err: any) => toast.error(err.message || "Action failed")
  });

  return (
    <div className="flex flex-col relative w-full pt-4 pb-20">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={phases.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
            {phases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={index}
                isExpanded={!!expandedPhases[phase.id]}
                onToggleExpand={() => toggleExpand(phase.id)}
                canManage={canManage}
                onTaskClick={onTaskClick}
                onAddTask={() => onAddTask(phase.id)}
                onEdit={() => setManageDialog({ isOpen: true, phase })}
                onDelete={() => {
                  if (confirm("Are you sure you want to delete this phase? Tasks will not be deleted but will lose their phase assignment.")) {
                    statusMutation.mutate({ phaseId: phase.id, action: 'delete' });
                  }
                }}
                onComplete={() => statusMutation.mutate({ phaseId: phase.id, action: 'complete' })}
                onReopen={() => statusMutation.mutate({ phaseId: phase.id, action: 'reopen' })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <PhaseManageDialog
        isOpen={manageDialog.isOpen}
        onOpenChange={(isOpen) => setManageDialog({ isOpen, phase: manageDialog.phase })}
        projectId={projectId}
        initialData={manageDialog.phase}
      />
    </div>
  );
}
