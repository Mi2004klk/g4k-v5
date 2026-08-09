// src/hooks/use-debounced-validation.ts
import { useState, useEffect, useRef } from "react";
function useDebouncedValidation(value, validateFn, delay = 400) {
  const [error, setError] = useState(null);
  const firstRender = useRef(true);
  useEffect(() => {
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

export {
  useDebouncedValidation
};
