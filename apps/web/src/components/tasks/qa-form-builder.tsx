"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Card, CardHeader, CardTitle, CardContent, AppIcon, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Checkbox, Switch, Badge, Alert, AlertTitle, AlertDescription } from "@g4k/ui/components";
import { Dialog, DialogContent, ConfirmDialog } from "@g4k/ui/components";
import { QAFormPreview } from "./qa-form-preview";
import { queryKeys } from "@/lib/query-keys";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface QAField {
  id: string; // for dnd
  label: string;
  description?: string;
  field_type: string;
  required: boolean;
  placeholder?: string;
  default_value?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
    custom_error?: string;
    allowed_file_types?: string[];
    max_file_size_mb?: number;
  };
  config?: {
    scale_min?: number;
    scale_max?: number;
    scale_min_label?: string;
    scale_max_label?: string;
    rating_max?: number;
    rating_icon?: string;
  };
  branching_logic: { target_section_id: string; condition: string } | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

import { cn } from "@/lib/utils";

function SortableFieldItem({ field, index, updateField, removeField, cloneField, allFields, activeId, setActiveId }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const isSection = field.field_type === "section";
  const isActive = activeId === field.id;

  const sectionFields = allFields.filter((f: any) => f.field_type === "section" && f.id !== field.id);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={() => setActiveId?.(field.id)}
      className={cn(
        "rounded-xl border flex flex-col relative transition-all shadow-sm overflow-hidden", 
        isSection 
          ? "border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10 mt-6" 
          : "border-neutral-200 dark:border-neutral-800 bg-card dark:bg-neutral-900",
        isActive && !isSection && "border-primary-400 dark:border-primary-600 shadow-md ring-1 ring-primary-500/20",
        isActive && isSection && "border-primary-500 ring-1 ring-primary-500/20 shadow-md"
      )}
    >
      {/* Left Active Accent */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500 rounded-l-xl z-10" />
      )}

      {/* Drag Handle & Section Header */}
      <div 
        {...attributes} 
        {...listeners} 
        className={cn(
          "w-full h-6 flex items-center justify-center cursor-grab text-neutral-300 hover:text-neutral-500 dark:text-neutral-700 dark:hover:text-neutral-500 transition-colors",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <AppIcon name="moreH" size="xs" />
      </div>

      <div className={cn("px-5 pb-5 pt-1 flex flex-col gap-4", isActive ? "pl-6" : "")}>
        <div className="flex items-start gap-4">
          <div className="flex-1 flex flex-col gap-3">
            <Input
              placeholder={isSection ? "Section Title" : "Question Title"}
              value={field.label}
              onChange={(e) => updateField(field.id, "label", e.target.value)}
              className={cn(
                "h-12 flex-1 shadow-sm px-4", 
                isSection ? "font-bold text-lg bg-transparent border-primary-200 focus:bg-white dark:focus:bg-neutral-950" : "text-base font-medium",
                !isActive && "border-transparent hover:border-neutral-200 bg-neutral-50/50 dark:bg-neutral-900/50"
              )}
            />
            
            {(isActive || field.description) && (
              <Input
                placeholder="Description (optional)"
                value={field.description || ""}
                onChange={(e) => updateField(field.id, "description", e.target.value)}
                className={cn(
                  "h-9 text-xs shadow-none border-dashed",
                  !isActive && "border-transparent bg-transparent px-1 hover:border-dashed hover:border-neutral-200"
                )}
              />
            )}
          </div>
          
          {isActive && !isSection && (
            <Select value={field.field_type} onValueChange={(val) => updateField(field.id, "field_type", val)}>
              <SelectTrigger className="w-56 h-12 shadow-sm bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 font-medium">
                <SelectValue placeholder="Type..." />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <div className="px-2 py-1.5 text-[10px] font-bold text-neutral-500 uppercase">Text</div>
                <SelectItem value="text"><div className="flex items-center gap-2"><AppIcon name="minus" size="xs" className="w-4" /> Short Text</div></SelectItem>
                <SelectItem value="textarea"><div className="flex items-center gap-2"><AppIcon name="menu" size="xs" className="w-4" /> Paragraph</div></SelectItem>
                <SelectItem value="number"><div className="flex items-center gap-2"><span className="w-4 font-bold text-center">123</span> Number</div></SelectItem>
                <SelectItem value="email"><div className="flex items-center gap-2"><AppIcon name="mail" size="xs" className="w-4" /> Email</div></SelectItem>
                <SelectItem value="phone"><div className="flex items-center gap-2"><AppIcon name="phone" size="xs" className="w-4" /> Phone</div></SelectItem>
                <SelectItem value="url"><div className="flex items-center gap-2"><AppIcon name="globe" size="xs" className="w-4" /> URL</div></SelectItem>
                
                <div className="px-2 py-1.5 text-[10px] font-bold text-neutral-500 uppercase mt-2">Choices</div>
                <SelectItem value="multiple_choice"><div className="flex items-center gap-2"><AppIcon name="circle" size="xs" className="w-4" /> Multiple Choice</div></SelectItem>
                <SelectItem value="checkbox"><div className="flex items-center gap-2"><AppIcon name="check" size="xs" className="w-4" /> Checkboxes</div></SelectItem>
                <SelectItem value="dropdown"><div className="flex items-center gap-2"><AppIcon name="chevronDown" size="xs" className="w-4" /> Dropdown</div></SelectItem>
                <SelectItem value="boolean"><div className="flex items-center gap-2"><AppIcon name="arrowRight" size="xs" className="w-4" /> Yes/No</div></SelectItem>

                <div className="px-2 py-1.5 text-[10px] font-bold text-neutral-500 uppercase mt-2">Scales & Rating</div>
                <SelectItem value="linear_scale"><div className="flex items-center gap-2"><AppIcon name="moreH" size="xs" className="w-4" /> Linear Scale</div></SelectItem>
                <SelectItem value="rating"><div className="flex items-center gap-2"><AppIcon name="star" size="xs" className="w-4" /> Rating</div></SelectItem>
                <SelectItem value="slider"><div className="flex items-center gap-2"><AppIcon name="sliders" size="xs" className="w-4" /> Slider</div></SelectItem>

                <div className="px-2 py-1.5 text-[10px] font-bold text-neutral-500 uppercase mt-2">Advanced</div>
                <SelectItem value="file_upload"><div className="flex items-center gap-2"><AppIcon name="upload" size="xs" className="w-4" /> File Upload</div></SelectItem>
                <SelectItem value="date"><div className="flex items-center gap-2"><AppIcon name="calendar" size="xs" className="w-4" /> Date</div></SelectItem>
                <SelectItem value="time"><div className="flex items-center gap-2"><AppIcon name="clock" size="xs" className="w-4" /> Time</div></SelectItem>
                <SelectItem value="datetime"><div className="flex items-center gap-2"><AppIcon name="calendar" size="xs" className="w-4" /> Date & Time</div></SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Options Editor for Choice Fields */}
        {isActive && !isSection && ["multiple_choice", "checkbox", "dropdown"].includes(field.field_type) && (
          <div className="flex flex-col gap-2 mt-2 ml-1">
            {(field.options || []).map((opt: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3 group">
                <AppIcon 
                  name={field.field_type === 'checkbox' ? 'check' : field.field_type === 'dropdown' ? 'chevronDown' : 'circle'} 
                  size="xs" 
                  className="text-neutral-400 w-4" 
                />
                <Input 
                  className="h-8 text-sm shadow-sm border-transparent hover:border-neutral-200 focus:border-primary-500 bg-transparent hover:bg-white dark:hover:bg-neutral-950 flex-1 max-w-md"
                  value={opt}
                  placeholder={`Option ${idx + 1}`}
                  onChange={(e) => {
                    const newOpts = [...(field.options || [])];
                    newOpts[idx] = e.target.value;
                    updateField(field.id, "options", newOpts);
                  }}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-neutral-400 hover:text-destructive opacity-0 group-hover:opacity-100" 
                  onClick={() => {
                    const newOpts = [...(field.options || [])];
                    newOpts.splice(idx, 1);
                    updateField(field.id, "options", newOpts);
                  }}
                >
                  <AppIcon name="close" size="xs" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <AppIcon 
                name={field.field_type === 'checkbox' ? 'check' : field.field_type === 'dropdown' ? 'chevronDown' : 'circle'} 
                size="xs" 
                className="text-neutral-300 w-4" 
              />
              <Button 
                variant="ghost" 
                className="h-8 text-sm text-neutral-500 hover:text-neutral-900 p-0 justify-start"
                onClick={() => {
                  const newOpts = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                  updateField(field.id, "options", newOpts);
                }}
              >
                Add option
              </Button>
            </div>
          </div>
        )}

        {/* Configuration for Scale/Rating */}
        {isActive && !isSection && ["linear_scale", "slider", "rating"].includes(field.field_type) && (
          <div className="flex flex-col gap-3 mt-2 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Configuration</h5>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-600">Min Value</label>
                <Input 
                  type="number" 
                  className="h-8 w-24 text-xs shadow-sm" 
                  value={field.config?.scale_min ?? (field.field_type === 'rating' ? 1 : 0)} 
                  onChange={(e) => updateField(field.id, "config", { ...field.config, scale_min: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-600">Max Value</label>
                <Input 
                  type="number" 
                  className="h-8 w-24 text-xs shadow-sm" 
                  value={field.config?.scale_max ?? (field.field_type === 'rating' ? 5 : 10)} 
                  onChange={(e) => updateField(field.id, "config", { ...field.config, scale_max: Number(e.target.value) })}
                />
              </div>
              {field.field_type !== 'rating' && (
                <>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs text-neutral-600">Min Label (Optional)</label>
                    <Input 
                      className="h-8 text-xs shadow-sm" 
                      placeholder="e.g. Strongly Disagree"
                      value={field.config?.scale_min_label || ""} 
                      onChange={(e) => updateField(field.id, "config", { ...field.config, scale_min_label: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs text-neutral-600">Max Label (Optional)</label>
                    <Input 
                      className="h-8 text-xs shadow-sm" 
                      placeholder="e.g. Strongly Agree"
                      value={field.config?.scale_max_label || ""} 
                      onChange={(e) => updateField(field.id, "config", { ...field.config, scale_max_label: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Validation / Advanced Rules */}
        {isActive && !isSection && ["text", "textarea", "number", "email", "url"].includes(field.field_type) && (
          <div className="flex flex-col gap-3 mt-2 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Validation Rules (Optional)</h5>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-neutral-600">{field.field_type === 'number' ? 'Min Value' : 'Min Length'}</label>
                <Input 
                  type="number" 
                  className="h-8 text-xs shadow-sm bg-white dark:bg-neutral-950" 
                  placeholder="e.g. 0"
                  value={field.validation?.min ?? ""} 
                  onChange={(e) => updateField(field.id, "validation", { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-neutral-600">{field.field_type === 'number' ? 'Max Value' : 'Max Length'}</label>
                <Input 
                  type="number" 
                  className="h-8 text-xs shadow-sm bg-white dark:bg-neutral-950" 
                  placeholder={field.field_type === 'number' ? "e.g. 100" : "e.g. 255"}
                  value={field.validation?.max ?? ""} 
                  onChange={(e) => updateField(field.id, "validation", { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-[2]">
                <label className="text-xs text-neutral-600">Custom Error Message</label>
                <Input 
                  className="h-8 text-xs shadow-sm bg-white dark:bg-neutral-950" 
                  placeholder="e.g. Please enter a valid value."
                  value={field.validation?.custom_error || ""} 
                  onChange={(e) => updateField(field.id, "validation", { ...field.validation, custom_error: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* File Upload Configuration */}
        {isActive && !isSection && field.field_type === "file_upload" && (
           <div className="flex flex-col gap-3 mt-2 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">File Upload Rules</h5>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-neutral-600">Max File Size (MB)</label>
                <Input 
                  type="number" 
                  className="h-8 text-xs shadow-sm bg-white dark:bg-neutral-950" 
                  placeholder="e.g. 10"
                  value={field.validation?.max_file_size_mb ?? 10} 
                  onChange={(e) => updateField(field.id, "validation", { ...field.validation, max_file_size_mb: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-[2]">
                <label className="text-xs text-neutral-600">Allowed Types (comma separated, e.g. .pdf, .jpg)</label>
                <Input 
                  className="h-8 text-xs shadow-sm bg-white dark:bg-neutral-950" 
                  placeholder="Leave empty for all types"
                  value={(field.validation?.allowed_file_types || []).join(", ")} 
                  onChange={(e) => updateField(field.id, "validation", { ...field.validation, allowed_file_types: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Branching Logic (for multiple_choice or boolean) */}
        {isActive && (field.field_type === "multiple_choice" || field.field_type === "boolean" || field.field_type === "dropdown") && sectionFields.length > 0 && (
          <div className="bg-primary-50/50 dark:bg-primary-900/10 p-3 rounded-md border border-primary-100 dark:border-primary-800/50 flex flex-col gap-2 mt-2">
            <h5 className="text-[10px] uppercase font-bold text-primary-600 flex items-center gap-1"><AppIcon name="menu" size="xs" /> Branching Logic</h5>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600">If answer matches</span>
              <Input 
                className="h-8 text-xs w-48 bg-white dark:bg-neutral-950 shadow-sm" 
                placeholder={field.field_type === "boolean" ? "'true' or 'false'" : "Exact option text"}
                value={field.branching_logic?.condition || ""}
                onChange={(e) => updateField(field.id, "branching_logic", { ...field.branching_logic, condition: e.target.value })}
              />
              <span className="text-xs text-neutral-600">goto</span>
              <Select 
                value={field.branching_logic?.target_section_id || ""} 
                onValueChange={(val) => updateField(field.id, "branching_logic", { ...field.branching_logic, target_section_id: val })}
              >
                <SelectTrigger className="w-56 h-8 text-xs bg-white dark:bg-neutral-950 shadow-sm">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Continue to next section</SelectItem>
                  {sectionFields.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.label || "Unnamed Section"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Actions Bar */}
        {isActive && (
          <div className="flex items-center justify-end gap-4 mt-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mr-auto">
              {field.field_type !== 'section' && (
                <div className="flex items-center gap-2">
                   <Switch 
                    id={`req-${field.id}`} 
                    checked={field.required} 
                    onCheckedChange={(checked) => updateField(field.id, "required", checked)} 
                   />
                   <label htmlFor={`req-${field.id}`} className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">Required</label>
                </div>
              )}
            </div>

            <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-400 hover:text-primary-600" onClick={() => cloneField(field.id)} title="Duplicate">
              <AppIcon name="copy" size="xs" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-400 hover:text-destructive" onClick={() => removeField(field.id)} title="Delete">
              <AppIcon name="trash" size="xs" />
            </Button>
            {field.field_type !== 'section' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-400">
                    <AppIcon name="more" size="xs" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => updateField(field.id, "description", field.description ? undefined : "")}>
                    <AppIcon name="menu" size="xs" className="mr-2" /> {field.description !== undefined ? "Remove Description" : "Add Description"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateField(field.id, "placeholder", field.placeholder ? undefined : "")}>
                    <AppIcon name="edit" size="xs" className="mr-2" /> {field.placeholder !== undefined ? "Remove Placeholder" : "Add Placeholder"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function QAFormBuilder() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: qaFormsData, isLoading: isLoadingForms } = useQuery({ 
    queryKey: queryKeys.qaForms, 
    queryFn: () => apiFetch("/qa-forms") 
  });
  
  const forms = Array.isArray(qaFormsData?.data) ? qaFormsData.data : Array.isArray(qaFormsData) ? qaFormsData : [];

  const updateFormMutation = useMutation({
    mutationFn: async () => {
      let currentSectionId: string | null = null;
      const apiFields = fields.map((f) => {
        if (f.field_type === "section") {
          currentSectionId = f.id;
        }
        return {
          label: f.label,
          field_type: f.field_type,
          required: f.required,
          options: f.options,
          section_id: currentSectionId,
          branching_logic: f.branching_logic
        };
      });

      return apiFetch(`/qa-forms/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({ title, description, is_template: true, fields: apiFields }),
      });
    },
    onSuccess: () => {
      toast.success("QA Form Template updated successfully.");
      setEditingId(null);
      setTitle("");
      setDescription("");
      setFields([
        { id: generateId(), label: "First Section", field_type: "section", required: false, options: [], branching_logic: null },
        { id: generateId(), label: "Check Code Formatting", field_type: "checkbox", required: true, options: [], branching_logic: null }
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.qaForms });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update QA form.");
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/qa-forms/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("QA Form deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.qaForms });
      setIsDeleteOpen(false);
      if (editingId === deletingId) {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setFields([]);
      }
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete QA form."),
  });

  const handleEdit = (form: any) => {
    setEditingId(form.id);
    setTitle(form.title || "");
    setDescription(form.description || "");
    const parsedFields = Array.isArray(form.fields) ? form.fields : [];
    setFields(parsedFields.map((f: any) => ({ ...f, id: f.id || generateId() })));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setFields([
      { id: generateId(), label: "First Section", field_type: "section", required: false, options: [], branching_logic: null },
      { id: generateId(), label: "Check Code Formatting", field_type: "checkbox", required: true, options: [], branching_logic: null }
    ]);
  };

  const [fields, setFields] = useState<QAField[]>([
    { id: generateId(), label: "First Section", field_type: "section", required: false, options: [], branching_logic: null },
    { id: generateId(), label: "Check Code Formatting", field_type: "checkbox", required: true, options: [], branching_logic: null },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const cloneField = (id: string) => {
    const fieldIndex = fields.findIndex((f) => f.id === id);
    if (fieldIndex > -1) {
      const field = fields[fieldIndex];
      const newField = { ...field, id: generateId(), label: `${field.label} (Copy)` };
      const newFields = [...fields];
      newFields.splice(fieldIndex + 1, 0, newField);
      setFields(newFields);
    }
  };

  const updateField = (id: string, key: keyof QAField, value: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const insertField = (type: string) => {
    const newField = { id: generateId(), label: "", field_type: type, required: false, options: [], branching_logic: null };
    if (!activeId) {
      setFields([...fields, newField]);
      setActiveId(newField.id);
      return;
    }
    const idx = fields.findIndex(f => f.id === activeId);
    if (idx !== -1) {
      const newFields = [...fields];
      newFields.splice(idx + 1, 0, newField);
      setFields(newFields);
      setActiveId(newField.id);
    } else {
      setFields([...fields, newField]);
      setActiveId(newField.id);
    }
  };

  const createFormMutation = useMutation({
    mutationFn: async () => {
      // transform for backend
      let currentSectionId: string | null = null;
      const apiFields = fields.map((f) => {
        if (f.field_type === "section") {
          currentSectionId = f.id;
        }
        return {
          label: f.label,
          field_type: f.field_type,
          required: f.required,
          options: f.options,
          section_id: currentSectionId,
          branching_logic: f.branching_logic
        };
      });

      return apiFetch("/qa-forms", {
        method: "POST",
        body: JSON.stringify({ title, description, is_template: true, fields: apiFields }),
      });
    },
    onSuccess: () => {
      toast.success("QA Form Template created successfully.");
      setTitle("");
      setDescription("");
      setFields([
        { id: generateId(), label: "First Section", field_type: "section", required: false, options: [], branching_logic: null },
        { id: generateId(), label: "Check Code Formatting", field_type: "checkbox", required: true, options: [], branching_logic: null }
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.qaForms });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create QA form.");
    },
  });

  const filteredForms = forms.filter((f: any) => f.title?.toLowerCase().includes(searchQuery.toLowerCase()) || f.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <div className="flex gap-4 h-full relative" onClick={(e) => {
        // If clicking outside the builder area (e.g. empty background), deselect field
        if ((e.target as HTMLElement).closest('.form-builder-canvas')) return;
        setActiveId(null);
      }}>
        {/* Sidebar */}
        <Card className="w-80 shrink-0 border border-neutral-200 dark:border-neutral-800 shadow-none rounded-xl overflow-hidden h-full flex flex-col bg-background">
          <CardHeader className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AppIcon name="archive" className="text-primary-500" /> Form Library
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] bg-white dark:bg-neutral-950 shadow-sm border border-neutral-200 dark:border-neutral-800">
                {forms.length} templates
              </Badge>
            </div>
            <Button className="w-full text-xs shadow-sm bg-primary-600 hover:bg-primary-700 h-9" onClick={() => { setEditingId(null); setTitle(""); setDescription(""); setFields([]); setActiveId(null); }}>
              <AppIcon name="plus" size="xs" className="mr-2" /> Create New Form
            </Button>
            <div className="mt-3 relative">
              <AppIcon name="search" size="xs" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input 
                placeholder="Search templates..." 
                className="h-9 pl-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-sm rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0 thin-scrollbar bg-neutral-50/30 dark:bg-neutral-950/30">
            {isLoadingForms ? (
              <div className="flex flex-col p-4 gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-lg flex flex-col gap-1.5 shadow-sm">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-sm w-3/4"></div>
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-sm w-1/2 mt-1"></div>
                  </div>
                ))}
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-2">
                  <AppIcon name="search" className="text-neutral-400" />
                </div>
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No templates found</div>
                <div className="text-xs text-neutral-500 max-w-[200px]">Create a new template to get started or try a different search.</div>
              </div>
            ) : (
              <div className="p-3 flex flex-col gap-2">
                {filteredForms.map((form: any) => {
                  const fieldCount = Array.isArray(form.fields) ? form.fields.length : 0;
                  return (
                    <div key={form.id} className={cn("p-4 rounded-xl flex items-start justify-between gap-3 border transition-all cursor-pointer group", editingId === form.id ? "bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/50 shadow-sm" : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm")} onClick={() => handleEdit(form)}>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn("text-sm font-semibold truncate", editingId === form.id ? "text-primary-700 dark:text-primary-400" : "text-neutral-800 dark:text-neutral-200")}>{form.title || "Untitled Form"}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500">
                          <span className="flex items-center gap-1"><AppIcon name="list" size="xs" className="w-3" /> {fieldCount} fields</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 shrink-0 shadow-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <AppIcon name="moreH" size="xs" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(form); }}>
                            <AppIcon name="edit" size="xs" className="mr-2" /> Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingId(form.id); setIsDeleteOpen(true); }}>
                            <AppIcon name="trash" size="xs" className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Builder Canvas */}
        <div className="flex-1 flex flex-col h-full bg-[#f0f4f9] dark:bg-neutral-950 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-inner form-builder-canvas relative">
          
          {/* Sticky Toolbar */}
          <div className="h-14 shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <AppIcon name="tasks" className="text-primary-600" />
              <h2 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate max-w-xs">{title || "Untitled Form"}</h2>
              {editingId && <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-none ml-2 text-[10px]">Editing Template</Badge>}
            </div>
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)} className="h-8 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400">
                <AppIcon name="eye" size="xs" className="mr-2" /> Preview
              </Button>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-8 text-xs font-semibold">Cancel</Button>
              )}
              <Button
                size="sm"
                onClick={() => editingId ? updateFormMutation.mutate() : createFormMutation.mutate()}
                disabled={createFormMutation.isPending || updateFormMutation.isPending || !title || fields.length === 0}
                className="h-8 text-xs font-bold px-6 shadow-sm bg-primary-600 hover:bg-primary-700"
              >
                {createFormMutation.isPending || updateFormMutation.isPending ? <AppIcon name="loading" size="xs" className="animate-spin mr-2" /> : <AppIcon name="save" size="xs" className="mr-2" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center pb-32">
            <div className="w-full max-w-3xl flex flex-col gap-4 relative">
              
              {/* Form Metadata Header Card */}
              <div 
                className={cn(
                  "bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden transition-all",
                  activeId === 'header' ? "ring-1 ring-primary-500/20 shadow-md border-primary-400 dark:border-primary-600" : ""
                )}
                onClick={() => setActiveId('header')}
              >
                {/* Top Theme Accent Bar */}
                <div className="h-3 w-full bg-primary-600" />
                {activeId === 'header' && <div className="absolute left-0 top-3 bottom-0 w-1.5 bg-primary-500 z-10" />}

                <div className={cn("p-6 flex flex-col gap-4", activeId === 'header' ? "pl-7" : "")}>
                  <Input
                    placeholder="Form Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={cn(
                      "h-14 text-3xl font-normal shadow-none px-0 rounded-none border-transparent hover:border-b-neutral-200 focus:border-b-primary-500 bg-transparent transition-all",
                      !title && "border-b-neutral-200"
                    )}
                    style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}
                  />
                  <Input
                    placeholder="Form description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-sm h-10 shadow-none px-0 rounded-none border-transparent hover:border-b-neutral-200 focus:border-b-primary-500 bg-transparent transition-all"
                  />
                </div>
              </div>

              {/* Form Fields Container */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4 min-h-[200px]">
                    {fields.map((field, index) => (
                      <SortableFieldItem 
                        key={field.id} 
                        field={field} 
                        index={index} 
                        updateField={updateField} 
                        removeField={removeField}
                        cloneField={cloneField}
                        allFields={fields}
                        activeId={activeId}
                        setActiveId={setActiveId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {fields.length === 0 && (
                <div className="text-center p-12 text-neutral-400 text-sm border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl bg-white/50 dark:bg-neutral-900/50 flex flex-col items-center gap-3">
                   <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                     <AppIcon name="plus" className="text-neutral-500" />
                   </div>
                   <div>Your form has no fields yet.</div>
                   <div className="text-xs">Use the floating menu on the right to add fields.</div>
                </div>
              )}
            </div>

            {/* Floating Action Palette (Google Forms Style) */}
            <div className="fixed right-8 md:right-12 xl:right-1/4 xl:-mr-20 top-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl p-2 flex flex-col gap-1 z-30 transition-all hover:shadow-2xl">
              <Button size="icon" variant="ghost" className="h-10 w-10 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg" onClick={() => insertField("text")} title="Add text field">
                <AppIcon name="plus" size="sm" />
              </Button>
              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1 mx-1" />
              <Button size="icon" variant="ghost" className="h-10 w-10 text-neutral-500 hover:text-primary-600 rounded-lg" onClick={() => insertField("multiple_choice")} title="Add multiple choice">
                <AppIcon name="circle" size="sm" />
              </Button>
              <Button size="icon" variant="ghost" className="h-10 w-10 text-neutral-500 hover:text-primary-600 rounded-lg" onClick={() => insertField("textarea")} title="Add paragraph">
                <AppIcon name="menu" size="sm" />
              </Button>
              <Button size="icon" variant="ghost" className="h-10 w-10 text-neutral-500 hover:text-primary-600 rounded-lg" onClick={() => insertField("date")} title="Add date">
                <AppIcon name="calendar" size="sm" />
              </Button>
              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1 mx-1" />
              <Button size="icon" variant="ghost" className="h-10 w-10 text-neutral-500 hover:text-primary-600 rounded-lg" onClick={() => insertField("section")} title="Add section">
                <AppIcon name="minus" size="sm" className="rotate-90 scale-y-150" />
              </Button>
            </div>
            
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete QA Form"
        description="Are you sure you want to delete this QA form? This action cannot be undone."
        confirmText="Delete Form"
        isDestructive={true}
        onConfirm={() => { if (deletingId) deleteFormMutation.mutate(deletingId); }}
      />
    </>
  );
}
