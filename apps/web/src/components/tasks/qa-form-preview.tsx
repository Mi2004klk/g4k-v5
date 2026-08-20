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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Group fields into sections
  const sections = useMemo(() => {
    const result: { id: string; label: string; fields: QAField[] }[] = [];
    let currentFields: QAField[] = [];
    let currentSectionId = "default";
    let currentSectionLabel = title || "Form";

    // If the first field isn't a section, we add a default one
    if (fields.length > 0 && (fields[0].field_type || (fields[0] as any).type) !== "section") {
      result.push({ id: currentSectionId, label: currentSectionLabel, fields: [] });
    }

    fields.forEach((field) => {
      if ((field.field_type || (field as any).type) === "section") {
        if (currentFields.length > 0 || result.length > 0) {
          const last = result[result.length - 1];
          if (last && last.fields.length === 0) {
            // Update empty section
            last.id = String(field.id);
            last.label = field.label || "";
          } else {
            result.push({ id: String(field.id), label: field.label || "", fields: [] });
          }
        } else {
          result.push({ id: String(field.id), label: field.label || "", fields: [] });
        }
        currentSectionId = String(field.id);
        currentSectionLabel = field.label || "";
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

  const validateCurrentSection = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    currentSection?.fields.forEach(field => {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = "This field is required.";
          isValid = false;
        }
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) return;

    // Evaluate branching logic
    let nextSectionId: string | null = null;

    for (const field of currentSection.fields) {
      if ((field as any).branching_logic && (field as any).branching_logic.condition && (field as any).branching_logic.target_section_id) {
        const val = answers[field.id];
        const condition = (field as any).branching_logic.condition;
        
        // Simple string match for condition
        if (String(val).toLowerCase() === String(condition).toLowerCase()) {
          nextSectionId = (field as any).branching_logic.target_section_id;
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

  const handleSubmit = () => {
    if (!validateCurrentSection()) return;
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-neutral-950">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <AppIcon name="success" className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Thank you!</h2>
        <p className="text-neutral-500 mb-8 max-w-sm">Your response has been recorded. This is just a preview, so no data was actually saved.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => { setIsSubmitted(false); setAnswers({}); setCurrentSectionIndex(0); }}>Submit another response</Button>
          {onClose && <Button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white">Close Preview</Button>}
        </div>
      </div>
    );
  }

  const progressPercentage = sections.length > 0 ? ((currentSectionIndex + 1) / sections.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-[#f0f4f9] dark:bg-neutral-950 relative overflow-hidden">
      {/* Top Banner */}
      <div className="h-4 bg-primary-600 shrink-0 w-full" />
      
      <div className="h-14 shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <AppIcon name="eye" className="text-primary-600" />
          <h2 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate max-w-xs">{title || "Untitled Form"}</h2>
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded uppercase tracking-wider border border-neutral-200 dark:border-neutral-700">Preview Mode</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs font-semibold">
            Close Preview
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center pb-32">
        <div className="w-full max-w-3xl flex flex-col gap-4 relative">
          
          {currentSectionIndex === 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden p-8 flex flex-col gap-2">
              <h1 className="text-3xl font-normal" style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}>{title || "Untitled Form"}</h1>
              {description && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{description}</p>}
              <div className="text-xs text-rose-500 font-medium mt-4">* Indicates required question</div>
            </div>
          )}

          {currentSection?.label && currentSectionIndex > 0 && (
             <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500" />
               <h2 className="text-xl font-normal ml-2">{currentSection.label}</h2>
             </div>
          )}

          {sections.length === 0 ? (
            <div className="text-center p-8 text-neutral-400">No fields to preview.</div>
          ) : (
            <div className="space-y-4">
              {currentSection?.fields.map((field) => (
                <div key={field.id} className={`bg-white dark:bg-neutral-900 p-6 rounded-xl border transition-all ${errors[field.id] ? 'border-rose-300 ring-1 ring-rose-500/20' : 'border-neutral-200 dark:border-neutral-800'}`}>
                  <label className="text-[15px] font-medium text-neutral-900 dark:text-white flex items-start gap-1 mb-1">
                    {field.label || "Untitled Question"}
                    {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {field.description && <p className="text-xs text-neutral-500 mb-4">{field.description}</p>}
                  
                  <div className="mt-4">
                    <QAFieldRenderer
                      field={field}
                      value={answers[field.id]}
                      onChange={(val) => {
                        setAnswers(prev => ({ ...prev, [field.id]: val }));
                        if (errors[field.id]) {
                          setErrors(prev => { const e = {...prev}; delete e[field.id]; return e; });
                        }
                      }}
                    />
                  </div>
                  {errors[field.id] && (
                    <div className="text-rose-500 text-xs font-medium mt-3 flex items-center gap-1.5">
                      <AppIcon name="info" size="xs" /> {errors[field.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 shadow-lg z-20 flex justify-center">
        <div className="w-full max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                onClick={handlePrev} 
                disabled={currentSectionIndex === 0}
                className="font-semibold shadow-sm"
              >
                Back
              </Button>
              {currentSectionIndex < sections.length - 1 ? (
                <Button onClick={handleNext} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm px-6">
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm px-6">
                  Submit
                </Button>
              )}
          </div>

          <div className="flex items-center gap-3">
             <div className="w-32 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
               <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
             </div>
             <span className="text-xs font-semibold text-neutral-500">Page {currentSectionIndex + 1} of {sections.length || 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
