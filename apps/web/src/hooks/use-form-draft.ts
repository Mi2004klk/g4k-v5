"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { openDB } from "idb";

const initDB = async () => {
  return openDB('g4k-form-drafts', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts');
      }
    },
  });
};

export function useFormDraft<T extends Record<string, any>>(key: string, initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [hasDraft, setHasDraft] = useState(false);
  const dataRef = useRef(formData);

  useEffect(() => {
    dataRef.current = formData;
  }, [formData]);

  // Check draft on mount
  useEffect(() => {
    const checkDraft = async () => {
      try {
        const db = await initDB();
        const saved = await db.get('drafts', key);
        if (saved) {
          setHasDraft(true);
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
    checkDraft();
  }, [key]);

  // 30-second autosave timer
  useEffect(() => {
    const timer = setInterval(async () => {
      const currentData = dataRef.current;
      if (currentData && Object.keys(currentData).some((k) => currentData[k] !== initialValues[k])) {
        try {
          const db = await initDB();
          await db.put('drafts', currentData, key);
        } catch (e) {
          console.error("Failed to autosave draft", e);
        }
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [key, initialValues]);

  const saveDraft = useCallback(async () => {
    try {
      const db = await initDB();
      await db.put('drafts', formData, key);
      setHasDraft(true);
      toast.success("Draft saved");
    } catch (e) {
      toast.error("Failed to save draft");
    }
  }, [key, formData]);

  const restoreDraft = useCallback(async () => {
    try {
      const db = await initDB();
      const saved = await db.get('drafts', key);
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
      const db = await initDB();
      await db.delete('drafts', key);
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
    clearDraft,
  };
}
