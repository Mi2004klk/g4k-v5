"use client";

import React, { useState } from "react";
import { AppIcon, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DatePicker, FileUploadPopup } from "@g4k/ui/components";
import { format } from "date-fns";
import { resolveAvatarUrl } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@g4k/ui/components";
import { AppUserPicker as UserPicker } from "@/components/app-user-picker";

export interface BuilderTask {
  id: string;
  title: string;
  assigneeId: string;
  description: string;
  dueDate?: string;
  attachmentPath?: string;
}

export interface BuilderPhase {
  id: string;
  name: string;
  assigneeId?: string;
  qaFormId?: string;
  workflowSettings?: {
    requiresApproval: boolean;
    notifyOnComplete: boolean;
  };
  tasks: BuilderTask[];
}

export interface PhaseBuilderProps {
  phases: BuilderPhase[];
  onChange: (phases: BuilderPhase[]) => void;
  qaForms?: { id: number; title: string; }[];
}

export function PhaseBuilder({ phases, onChange, qaForms = [] }: PhaseBuilderProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    phases.reduce((acc, p) => ({ ...acc, [p.id]: true }), {})
  );

  const togglePhase = (id: string) => {
    setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updatePhase = (phaseId: string, updates: Partial<BuilderPhase>) => {
    onChange(phases.map(p => p.id === phaseId ? { ...p, ...updates } : p));
  };

  const addTask = (phaseId: string) => {
    const newTask: BuilderTask = {
      id: `task-${Date.now()}`,
      title: "",
      description: "",
      assigneeId: "none",
    };
    onChange(phases.map(p => {
      if (p.id === phaseId) {
        return { ...p, tasks: [...p.tasks, newTask] };
      }
      return p;
    }));
  };

  const updateTask = (phaseId: string, taskId: string, updates: Partial<BuilderTask>) => {
    onChange(phases.map(p => {
      if (p.id === phaseId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        };
      }
      return p;
    }));
  };

  const removeTask = (phaseId: string, taskId: string) => {
    onChange(phases.map(p => {
      if (p.id === phaseId) {
        return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
      }
      return p;
    }));
  };

  const addPhase = () => {
    const newPhase: BuilderPhase = {
      id: `phase-${Date.now()}`,
      name: `Phase ${phases.length + 1}`,
      assigneeId: "none",
      qaFormId: "none",
      workflowSettings: {
        requiresApproval: false,
        notifyOnComplete: true,
      },
      tasks: [],
    };
    onChange([...phases, newPhase]);
    setExpandedPhases(prev => ({ ...prev, [newPhase.id]: true }));
  };

  const removePhase = (phaseId: string) => {
    onChange(phases.filter(p => p.id !== phaseId));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2">
      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-6 top-6 bottom-0 w-px border-l-2 border-dashed border-emerald-200 dark:border-emerald-900/50 -z-10" />

        <div className="flex flex-col gap-8">
          {phases.map((phase, index) => {
            const isExpanded = expandedPhases[phase.id];
            
            return (
              <div key={phase.id} className="relative flex gap-6">
                
                {/* Timeline node */}
                <div className="flex flex-col items-center shrink-0 w-12 pt-2">
                  <div className="w-12 h-6 rounded-full bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-500 z-10">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                {/* Phase Box */}
                <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900/50 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden">
                  
                  {/* Phase Header */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                        className="text-lg font-black text-emerald-900 dark:text-emerald-100 bg-transparent border-transparent hover:border-emerald-200 focus:bg-white dark:focus:bg-neutral-900 h-auto py-1 px-2 -ml-2"
                        placeholder="Phase Name (e.g. Concept Create)"
                        aria-label="Phase Name"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removePhase(phase.id)} aria-label="Delete phase">
                        <AppIcon name="trash" className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => togglePhase(phase.id)} className="text-emerald-600" aria-label={isExpanded ? "Collapse phase" : "Expand phase"}>
                        <AppIcon name={isExpanded ? "chevronUp" : "chevronDown"} className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Phase Content */}
                  {isExpanded && (
                    <div className="flex flex-col p-4 gap-6 bg-emerald-50/10 dark:bg-emerald-950/10">
                      
                      {/* Phase Settings Block */}
                      <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-neutral-900 space-y-4">
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide border-b border-emerald-100 dark:border-emerald-900/30 pb-2">Phase Settings</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Phase Assignee / Owner</label>
                            <UserPicker 
                              mode="single"
                              value={phase.assigneeId && phase.assigneeId !== "none" ? parseInt(phase.assigneeId) : undefined}
                              onChange={(val) => updatePhase(phase.id, { assigneeId: val ? val.toString() : "none" })}
                              placeholder="Select Assignee"
                              className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 text-sm rounded-lg border-emerald-100 dark:border-emerald-900/30"
                            />
                          </div>

                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Required QA Form</label>
                            <Select value={phase.qaFormId || "none"} onValueChange={(v) => updatePhase(phase.id, { qaFormId: v })}>
                              <SelectTrigger className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 text-sm rounded-lg border-emerald-100 dark:border-emerald-900/30">
                                <SelectValue placeholder="No QA Form" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {qaForms.map(qa => (
                                  <SelectItem key={qa.id} value={qa.id.toString()}>{qa.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-6 pt-2">
                          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                            <input 
                              type="checkbox" 
                              checked={phase.workflowSettings?.requiresApproval ?? false}
                              onChange={(e) => updatePhase(phase.id, { 
                                workflowSettings: { ...phase.workflowSettings!, requiresApproval: e.target.checked }
                              })}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            Requires Approval to Complete
                          </label>
                          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                            <input 
                              type="checkbox" 
                              checked={phase.workflowSettings?.notifyOnComplete ?? true}
                              onChange={(e) => updatePhase(phase.id, { 
                                workflowSettings: { ...phase.workflowSettings!, notifyOnComplete: e.target.checked }
                              })}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            Notify on Completion
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide border-b border-emerald-100 dark:border-emerald-900/30 pb-2">Phase Tasks</h4>
                        {phase.tasks.map((task) => (
                        <div key={task.id} className="flex flex-col gap-3 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl relative group">
                          
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-opacity" onClick={() => removeTask(phase.id, task.id)} aria-label="Remove task">
                            <AppIcon name="close" className="w-4 h-4" />
                          </Button>

                          {/* Task Title */}
                          <Input 
                            value={task.title}
                            onChange={(e) => updateTask(phase.id, task.id, { title: e.target.value })}
                            placeholder="Task Name (e.g. Project created)"
                            aria-label="Task Name"
                            className="font-medium bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-lg h-10"
                          />

                          {/* Task Meta (Assignee & Date) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <UserPicker 
                              mode="single"
                              value={task.assigneeId && task.assigneeId !== "none" ? parseInt(task.assigneeId) : undefined}
                              onChange={(val) => updateTask(phase.id, task.id, { assigneeId: val ? val.toString() : "none" })}
                              placeholder="Assign To"
                              className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 text-xs rounded-lg"
                            />

                            <DatePicker
                              value={task.dueDate ? new Date(task.dueDate) : undefined}
                              onChange={(date) => updateTask(phase.id, task.id, { dueDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                              placeholder="Due Date"
                              className="h-9 w-full bg-neutral-50 dark:bg-neutral-950 text-xs rounded-lg"
                            />
                          </div>

                          {/* Task Description */}
                          <Input
                            value={task.description}
                            onChange={(e) => updateTask(phase.id, task.id, { description: e.target.value })}
                            placeholder="Task description or notes (e.g. No employee update added yet)"
                            className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-lg h-9"
                          />

                          {/* Attachment Block (Static representation matching design) */}
                          <div className="flex flex-col gap-2 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg mt-1">
                            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Source attachment</span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-emerald-700 bg-white border-neutral-200" disabled>
                                <AppIcon name="clipboard" className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                                Read Text
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-emerald-700 bg-white border-neutral-200" disabled>
                                <AppIcon name="download" className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                                Print Text
                              </Button>
                            </div>
                          </div>

                        </div>
                      ))}

                      <Button variant="ghost" onClick={() => addTask(phase.id)} className="w-full mt-2 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dashed-border">
                        <AppIcon name="plus" className="w-4 h-4 mr-2" />
                        Add Task to Phase
                      </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <Button variant="outline" onClick={addPhase} className="mx-auto mt-4 w-[250px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-full">
        <AppIcon name="plus" className="w-4 h-4 mr-2" />
        Add New Phase
      </Button>
    </div>
  );
}
