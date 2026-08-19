"use client";

import React, { useState, useMemo } from "react";
import { QAField } from "./qa-form-builder";
import { QAFieldRenderer } from "../projects/qa-field-renderer";
import { Button, Card, CardContent, CardHeader, CardTitle, AppIcon } from "@g4k/ui/components";

interface QAFormPreviewProps {
  title: string;
  description: string;
  fields: QAField[];
  onClose?: () => void;
}

export function QAFormPreview({ title, description, fields, onClose }: QAFormPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Group fields into sections
  const sections = useMemo(() => {
    const result: { id: string; label: string; fields: QAField[] }[] = [];
    let currentFields: QAField[] = [];
    let currentSectionId = "default";
    let currentSectionLabel = title || "Form";

    // If the first field isn't a section, we add a default one
    if (fields.length > 0 && fields[0].field_type !== "section") {
      result.push({ id: currentSectionId, label: currentSectionLabel, fields: [] });
    }

    fields.forEach((field) => {
      if (field.field_type === "section") {
        if (currentFields.length > 0 || result.length > 0) {
          const last = result[result.length - 1];
          if (last && last.fields.length === 0) {
            // Update empty section
            last.id = field.id;
            last.label = field.label;
          } else {
            result.push({ id: field.id, label: field.label, fields: [] });
          }
        } else {
          result.push({ id: field.id, label: field.label, fields: [] });
        }
        currentSectionId = field.id;
        currentSectionLabel = field.label;
      } else {
        if (result.length === 0) {
          result.push({ id: currentSectionId, label: currentSectionLabel, fields: [] });
        }
        result[result.length - 1].fields.push(field);
      }
    });

    return result;
  }, [fields, title]);

  const currentSection = sections[currentSectionIndex];

  const handleNext = () => {
    // Evaluate branching logic
    let nextSectionId: string | null = null;

    for (const field of currentSection.fields) {
      if (field.branching_logic && field.branching_logic.condition && field.branching_logic.target_section_id) {
        const val = answers[field.id];
        const condition = field.branching_logic.condition;
        
        // Simple string match for condition
        if (String(val).toLowerCase() === String(condition).toLowerCase()) {
          nextSectionId = field.branching_logic.target_section_id;
          break; // First match wins
        }
      }
    }

    if (nextSectionId) {
      const targetIndex = sections.findIndex(s => s.id === nextSectionId);
      if (targetIndex !== -1) {
        setCurrentSectionIndex(targetIndex);
        return;
      }
    }

    // Default next
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  return (
    <Card className="border border-primary-200 dark:border-primary-900 shadow-xl rounded-xl overflow-hidden h-full flex flex-col bg-card">
      <CardHeader className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800 flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle className="text-lg font-bold text-primary-900 dark:text-primary-100">
            {title || "Untitled Form"}
            <span className="ml-2 text-xs font-normal px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded uppercase tracking-wider">Preview Mode</span>
          </CardTitle>
          {description && <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{description}</p>}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-neutral-500 hover:text-neutral-700">
            <AppIcon name="close" size="sm" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
        {sections.length === 0 ? (
          <div className="text-center p-8 text-neutral-400">No fields to preview.</div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-6 text-foreground border-b pb-2">{currentSection?.label}</h3>
            
            <div className="space-y-6">
              {currentSection?.fields.map((field) => (
                <div key={field.id} className="space-y-2 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-start gap-1">
                    {field.label}
                    {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <QAFieldRenderer
                    field={{
                      id: field.id,
                      type: field.field_type,
                      label: field.label,
                      options: field.options,
                    }}
                    value={answers[field.id]}
                    onChange={(val) => setAnswers(prev => ({ ...prev, [field.id]: val }))}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button 
                variant="outline" 
                onClick={handlePrev} 
                disabled={currentSectionIndex === 0}
              >
                Previous
              </Button>

              <div className="text-xs text-neutral-400 font-medium">
                Page {currentSectionIndex + 1} of {sections.length}
              </div>

              {currentSectionIndex < sections.length - 1 ? (
                <Button onClick={handleNext} className="bg-primary-600 hover:bg-primary-700 text-white">
                  Next Page
                </Button>
              ) : (
                <Button onClick={() => alert("Form Submitted in Preview Mode!")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Submit
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
