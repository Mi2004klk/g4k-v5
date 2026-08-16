import { useState } from "react";

export function useFormErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const setErrorsFromResponse = (err: any) => {
    if (err?.errors) {
      setFieldErrors(err.errors);
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
