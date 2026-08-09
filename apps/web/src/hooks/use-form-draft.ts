"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export function useFormDraft<T extends Record<string, any>>(key: string, initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [hasDraft, setHasDraft] = useState(false);

  // Check draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`form_draft_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, [key]);

  // 30-second autosave timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (formData && Object.keys(formData).some((k) => formData[k] !== initialValues[k])) {
        localStorage.setItem(`form_draft_${key}`, JSON.stringify(formData));
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [key, formData, initialValues]);

  const saveDraft = useCallback(() => {
    localStorage.setItem(`form_draft_${key}`, JSON.stringify(formData));
    toast.success("Draft saved locally");
  }, [key, formData]);

  const restoreDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(`form_draft_${key}`);
      if (saved) {
        setFormData(JSON.parse(saved));
        toast.info("Form draft restored!");
      }
    } catch {
      toast.error("Failed to restore draft");
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`form_draft_${key}`);
    setHasDraft(false);
  }, [key]);

  return {
    formData,
    setFormData,
    hasDraft,
    saveDraft,
    restoreDraft,
    clearDraft,
  };
}
