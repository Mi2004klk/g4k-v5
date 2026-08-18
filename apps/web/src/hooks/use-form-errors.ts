import { useState } from "react";

export function useFormErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const setErrorsFromResponse = (err: { errors?: Record<string, string[]> } | unknown) => {
    if (err && typeof err === 'object' && 'errors' in err) {
      setFieldErrors((err as { errors: Record<string, string[]> }).errors);
    } else {
      setFieldErrors({});
    }
  };

  const clearErrors = () => setFieldErrors({});

  return {
    fieldErrors,
    setFieldErrors,
    setErrorsFromResponse,
    clearErrors,
  };
}
