import React, { useState, useMemo } from "react";
import { QAFieldRenderer, QAField } from "./qa-field-renderer";
import { Button, AppIcon } from "@g4k/ui/components";

export function QAFormViewer({ 
  qaForm, 
  qaValues, 
  setQaValues 
}: { 
  qaForm: any; 
  qaValues: any; 
  setQaValues: (vals: any) => void;
}) {
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

  // Group fields into sections
  const sections = useMemo(() => {
    const list: { id: string, title: string, fields: any[] }[] = [];
    let current = { id: "default", title: qaForm.title || "Section", fields: [] as any[] };
    
    (qaForm.fields || []).forEach((f: any) => {
      if ((f.field_type || f.type) === "section") {
        if (current.fields.length > 0 || current.id !== "default") {
          list.push(current);
        }
        current = { id: f.id.toString(), title: f.label || "Section", fields: [] };
      } else {
        current.fields.push(f);
      }
    });
    if (current.fields.length > 0 || list.length === 0) {
      list.push(current);
    }
    return list;
  }, [qaForm]);

  const activeSectionIndex = useMemo(() => {
    if (!currentSectionId) return 0;
    const idx = sections.findIndex(s => s.id === currentSectionId);
    return Math.max(0, idx);
  }, [currentSectionId, sections]);

  const activeSection = sections[activeSectionIndex];

  const handleNext = () => {
    // Check if any field in the current section has branching logic that matches
    for (const f of activeSection.fields) {
      if (f.branching_logic && f.branching_logic.condition && f.branching_logic.target_section_id) {
        const val = qaValues[f.id];
        // simple string match
        if (val !== undefined && val !== null && val.toString().toLowerCase() === f.branching_logic.condition.toLowerCase()) {
          setCurrentSectionId(f.branching_logic.target_section_id.toString());
          return;
        }
      }
    }
    // Otherwise go to next section sequentially
    if (activeSectionIndex < sections.length - 1) {
      setCurrentSectionId(sections[activeSectionIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (activeSectionIndex > 0) {
      setCurrentSectionId(sections[activeSectionIndex - 1].id);
    }
  };

  const isLastSection = activeSectionIndex === sections.length - 1;

  if (!qaForm || !qaForm.fields) return null;

  return (
    <div className="space-y-4">
      {sections.length > 1 && (
        <div className="flex items-center gap-2 mb-2">
          {sections.map((s, i) => (
            <div key={s.id} className={`flex-1 h-1.5 rounded-full ${i <= activeSectionIndex ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
          ))}
        </div>
      )}
      
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
          {activeSection.title}
        </h4>
        {activeSection.fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
              <span>{field.label} {field.required && <span className="text-rose-500">*</span>}</span>
            </label>
            <QAFieldRenderer
              field={field}
              value={qaValues[field.id]}
              onChange={(val) => setQaValues({ ...qaValues, [field.id]: val })}
            />
          </div>
        ))}
      </div>

      {sections.length > 1 && (
        <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={handlePrev} 
            disabled={activeSectionIndex === 0}
            className="flex-1"
          >
            Previous
          </Button>
          <Button 
            type="button"
            size="sm" 
            onClick={handleNext} 
            disabled={isLastSection}
            className="flex-1 bg-primary text-white hover:bg-primary/90"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
