"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Card, CardHeader, CardTitle, CardContent, AppIcon } from "@g4k/ui/components";
import { Dialog, DialogContent, ConfirmDialog } from "@g4k/ui/components";
import { QAFormPreview } from "./qa-form-preview";
import { queryKeys } from "@/lib/query-keys";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface QAField {
  id: string; // for dnd
  label: string;
  field_type: string;
  required: boolean;
  options: string[];
  branching_logic: { target_section_id: string; condition: string } | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function SortableFieldItem({ field, index, updateField, removeField, allFields }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const isSection = field.field_type === "section";

  // Section options for branching
  const sectionFields = allFields.filter((f: any) => f.field_type === "section" && f.id !== field.id);

  return (
    <div ref={setNodeRef} style={style} className={`p-3 rounded-xl border ${isSection ? 'border-primary/50 bg-primary/5' : 'border-neutral-200 dark:border-neutral-800 bg-transparent'} flex flex-col gap-3 relative transition-colors`}>
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary text-neutral-400 p-1">
          <AppIcon name="menu" size="sm" />
        </div>
        
        <div className="flex-1 flex gap-2">
          <Input
            placeholder={isSection ? "Section Title" : "Field Label"}
            value={field.label}
            onChange={(e) => updateField(field.id, "label", e.target.value)}
            className={`h-9 flex-1 ${isSection ? 'font-bold text-sm' : 'text-xs'}`}
          />
          <Select value={field.field_type} onValueChange={(val) => updateField(field.id, "field_type", val)}>
            <SelectTrigger className="w-40 h-9 text-xs">
              <SelectValue placeholder="Type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text (Short)</SelectItem>
              <SelectItem value="textarea">Textarea (Long)</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Yes/No (Boolean)</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="file_upload">File Upload</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="section">-- Section Divider --</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-rose-600 hover:text-rose-700"
          onClick={() => removeField(field.id)}
        >
          <AppIcon name="trash" size="sm" />
        </Button>
      </div>

      {/* Conditional Fields based on Type */}
      {!isSection && (
        <div className="pl-9 flex flex-col gap-2">
          {field.field_type === "multiple_choice" && (
            <div className="space-y-2">
              <span className="text-xs text-neutral-500 font-semibold block">Options (comma separated):</span>
              <Input 
                className="h-8 text-xs" 
                placeholder="Option A, Option B, Option C"
                value={(field.options || []).join(", ")}
                onChange={(e) => updateField(field.id, "options", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
              />
            </div>
          )}

          {/* Branching Logic (for multiple_choice or boolean) */}
          {(field.field_type === "multiple_choice" || field.field_type === "boolean") && sectionFields.length > 0 && (
            <div className="bg-neutral-50 dark:bg-neutral-900 p-2 rounded-md border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Branching:</span>
              <span className="text-xs text-neutral-600">If</span>
              <Input 
                className="h-7 text-xs w-32" 
                placeholder={field.field_type === "boolean" ? "'true' or 'false'" : "Option value"}
                value={field.branching_logic?.condition || ""}
                onChange={(e) => updateField(field.id, "branching_logic", { ...field.branching_logic, condition: e.target.value })}
              />
              <span className="text-xs text-neutral-600">goto</span>
              <Select 
                value={field.branching_logic?.target_section_id || ""} 
                onValueChange={(val) => updateField(field.id, "branching_logic", { ...field.branching_logic, target_section_id: val })}
              >
                <SelectTrigger className="w-40 h-7 text-xs">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sectionFields.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.label || "Unnamed Section"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id={`req-${field.id}`} 
              checked={field.required} 
              onChange={(e) => updateField(field.id, "required", e.target.checked)} 
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-600 w-3.5 h-3.5"
            />
            <label htmlFor={`req-${field.id}`} className="text-xs text-neutral-600 cursor-pointer">Required field</label>
          </div>
        </div>
      )}
    </div>
  );
}

export function QAFormBuilder() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const addField = () => {
    setFields([...fields, { id: generateId(), label: "New Field", field_type: "text", required: false, options: [], branching_logic: null }]);
  };

  const addSection = () => {
    setFields([...fields, { id: generateId(), label: "New Section", field_type: "section", required: false, options: [], branching_logic: null }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, key: keyof QAField, value: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
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

  return (
    <>
      <div className="flex gap-4 h-full">
      <Card className="w-80 shrink-0 border border-neutral-200 dark:border-neutral-800 shadow-none rounded-xl overflow-hidden h-full flex flex-col">
        <CardHeader className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-3">
          <CardTitle className="text-sm font-bold">Existing QA Forms</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {isLoadingForms ? (
            <div className="p-4 text-center text-xs text-neutral-500">Loading forms...</div>
          ) : forms.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">No QA forms found.</div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {forms.map((form: any) => (
                <div key={form.id} className="p-4 flex flex-col gap-2 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-sm font-semibold">{form.title}</h4>
                      {form.description && <p className="text-xs text-neutral-500 line-clamp-2">{form.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleEdit(form)}>
                      <AppIcon name="edit" size="xs" className="mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => { setDeletingId(form.id); setIsDeleteOpen(true); }}>
                      <AppIcon name="trash" size="xs" className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 border border-neutral-200 dark:border-neutral-800 shadow-none rounded-xl overflow-hidden h-full flex flex-col">

      <CardHeader className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <CardTitle className="text-base font-bold flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <AppIcon name="success" className="text-primary" />
            {editingId ? "Edit QA Form Template" : "Create QA Form Template"}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="h-8">
            <AppIcon name="search" size="xs" className="mr-2" />
            Preview
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <Input
            placeholder="Form Title (e.g. Code Review Checklist)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-semibold h-10"
          />
          <Input
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Form Fields</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addSection} className="h-8 text-xs bg-white dark:bg-neutral-950">
                <AppIcon name="plus" size="xs" className="mr-1" /> Add Section
              </Button>
              <Button size="sm" onClick={addField} className="h-8 text-xs">
                <AppIcon name="plus" size="xs" className="mr-1" /> Add Field
              </Button>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <SortableFieldItem 
                    key={field.id} 
                    field={field} 
                    index={index} 
                    updateField={updateField} 
                    removeField={removeField} 
                    allFields={fields}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {fields.length === 0 && (
            <div className="text-center p-6 text-neutral-400 text-xs border border-dashed rounded-lg">
              No fields added yet. Click "Add Field" or "Add Section" to begin.
            </div>
          )}
        </div>

        
        <div className="flex gap-2">
          {editingId && (
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="font-semibold h-10 text-sm w-1/3"
            >
              Cancel Edit
            </Button>
          )}
          <Button
            onClick={() => editingId ? updateFormMutation.mutate() : createFormMutation.mutate()}
            disabled={createFormMutation.isPending || updateFormMutation.isPending || !title || fields.length === 0}
            className="font-semibold h-10 text-sm flex-1 text-white"
          >
            {createFormMutation.isPending || updateFormMutation.isPending ? <AppIcon name="loading" size="sm" className="animate-spin" /> : (editingId ? "Update QA Template" : "Save QA Template")}
          </Button>
        </div>

      </CardContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="h-full w-full bg-background rounded-xl overflow-hidden shadow-2xl">
            <QAFormPreview
              title={title}
              description={description}
              fields={fields}
              onClose={() => setPreviewOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
    </div>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete QA Form"
        description="Are you sure you want to delete this QA form? This action cannot be undone."
        confirmText="Delete Form"
        onConfirm={() => { if (deletingId) deleteFormMutation.mutate(deletingId); }}
      />
    </>
  );
}
