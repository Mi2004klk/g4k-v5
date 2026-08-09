"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hooks/index.ts
var hooks_exports = {};
__export(hooks_exports, {
  useDebouncedValidation: () => useDebouncedValidation,
  useFormDraft: () => useFormDraft
});
module.exports = __toCommonJS(hooks_exports);

// src/hooks/use-debounced-validation.ts
var import_react = require("react");
function useDebouncedValidation(value, validateFn, delay = 400) {
  const [error, setError] = (0, import_react.useState)(null);
  const firstRender = (0, import_react.useRef)(true);
  (0, import_react.useEffect)(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handler = setTimeout(() => {
      setError(validateFn(value));
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, validateFn, delay]);
  return error;
}

// src/hooks/use-form-draft.ts
var import_react2 = require("react");
var import_idb_keyval = require("idb-keyval");
var import_sonner = require("sonner");
function useFormDraft(key, initialValues) {
  const [formData, setFormData] = (0, import_react2.useState)(initialValues);
  const [hasDraft, setHasDraft] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    async function checkDraft() {
      try {
        const saved = await (0, import_idb_keyval.get)(`form_draft_${key}`);
        if (saved) {
          setHasDraft(true);
        }
      } catch {
      }
    }
    checkDraft();
  }, [key]);
  (0, import_react2.useEffect)(() => {
    const timer = setInterval(async () => {
      if (formData && Object.keys(formData).some((k) => formData[k] !== initialValues[k])) {
        try {
          await (0, import_idb_keyval.set)(`form_draft_${key}`, formData);
        } catch (e) {
          console.error("Failed to autosave draft", e);
        }
      }
    }, 3e4);
    return () => clearInterval(timer);
  }, [key, formData, initialValues]);
  const saveDraft = (0, import_react2.useCallback)(async () => {
    try {
      await (0, import_idb_keyval.set)(`form_draft_${key}`, formData);
      import_sonner.toast.success("Draft saved securely");
    } catch {
      import_sonner.toast.error("Failed to save draft");
    }
  }, [key, formData]);
  const restoreDraft = (0, import_react2.useCallback)(async () => {
    try {
      const saved = await (0, import_idb_keyval.get)(`form_draft_${key}`);
      if (saved) {
        setFormData(saved);
        import_sonner.toast.info("Form draft restored!");
      }
    } catch {
      import_sonner.toast.error("Failed to restore draft");
    }
  }, [key]);
  const clearDraft = (0, import_react2.useCallback)(async () => {
    try {
      await (0, import_idb_keyval.del)(`form_draft_${key}`);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useDebouncedValidation,
  useFormDraft
});
