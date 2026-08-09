import { useState, useEffect, useRef } from "react";

/**
 * A hook that delays validation state updates while the user is typing,
 * preventing aggressive inline errors (R13.16).
 *
 * @param value The current input value
 * @param validateFn Function that returns an error string or null
 * @param delay Delay in milliseconds (default 400ms per DR)
 * @returns The debounced error message
 */
export function useDebouncedValidation<T>(
  value: T,
  validateFn: (val: T) => string | null,
  delay: number = 400
): string | null {
  const [error, setError] = useState<string | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Don't validate on initial mount
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
