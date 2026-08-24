"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

export function useFormDraft<T extends Record<string, unknown>>(key: string, initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [hasDraft, setHasDraft] = useState(false);
  const dataRef = useRef(formData);

  // We use useMemo for the stringification to only compute it when the reference actually changes
  // and keep a stable reference.
  const initialValuesString = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  useEffect(() => {
    dataRef.current = formData;
  }, [formData]);

  // Check draft on mount
  useEffect(() => {
    const checkDraft = async () => {
      try {
        const db = await initDB();
        const saved = await db.get('drafts', key);
        if (saved && JSON.stringify(saved) !== initialValuesString) {
          setHasDraft(true);
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
    checkDraft();
  }, [key, initialValuesString]);

  // 30-second autosave timer
  useEffect(() => {
    const timer = setInterval(async () => {
      const currentData = dataRef.current;
      if (currentData && JSON.stringify(currentData) !== initialValuesString) {
        try {
          const db = await initDB();
          await db.put('drafts', currentData, key);
        } catch (e) {
          console.error("Failed to autosave draft", e);
        }
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [key, initialValuesString]);

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
        setHasDraft(false); // Clear banner when restored
        toast.info("Form draft restored!");
        return saved;
      }
      return null;
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
