import {
  useDebouncedValidation,
  useIsMobile
} from "../chunk-EEUYD32C.mjs";
import "../chunk-6DZX6EAA.mjs";

// src/hooks/use-form-draft.ts
import { useEffect, useState, useCallback } from "react";
import { get, set, del } from "idb-keyval";
import { toast } from "sonner";
function useFormDraft(key, initialValues) {
  const [formData, setFormData] = useState(initialValues);
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    async function checkDraft() {
      try {
        const saved = await get(`form_draft_${key}`);
        if (saved) {
          setHasDraft(true);
        }
      } catch {
      }
    }
    checkDraft();
  }, [key]);
  useEffect(() => {
    const timer = setInterval(async () => {
      if (formData && Object.keys(formData).some((k) => formData[k] !== initialValues[k])) {
        try {
          await set(`form_draft_${key}`, formData);
        } catch (e) {
          console.error("Failed to autosave draft", e);
        }
      }
    }, 3e4);
    return () => clearInterval(timer);
  }, [key, formData, initialValues]);
  const saveDraft = useCallback(async () => {
    try {
      await set(`form_draft_${key}`, formData);
      toast.success("Draft saved securely");
    } catch {
      toast.error("Failed to save draft");
    }
  }, [key, formData]);
  const restoreDraft = useCallback(async () => {
    try {
      const saved = await get(`form_draft_${key}`);
      if (saved) {
        setFormData(saved);
        toast.info("Form draft restored!");
      }
    } catch {
      toast.error("Failed to restore draft");
    }
  }, [key]);
  const clearDraft = useCallback(async () => {
    try {
      await del(`form_draft_${key}`);
      setHasDraft(false);
    } catch (e) {
      console.error("Failed to clear draft", e);
    }
  }, [key]);
  return {
    formData,
    setFormData,
    hasDraft,
    saveDraft,
    restoreDraft,
    clearDraft
  };
}
export {
  useDebouncedValidation,
  useFormDraft,
  useIsMobile
};
