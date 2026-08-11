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

// src/hooks/use-mobile.ts
import { useEffect as useEffect2, useState as useState2 } from "react";
var MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = useState2(void 0);
  useEffect2(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}

export {
  useDebouncedValidation,
  useIsMobile
};
