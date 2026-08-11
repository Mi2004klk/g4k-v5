import * as React from 'react';

/**
 * A hook that delays validation state updates while the user is typing,
 * preventing aggressive inline errors (R13.16).
 *
 * @param value The current input value
 * @param validateFn Function that returns an error string or null
 * @param delay Delay in milliseconds (default 400ms per DR)
 * @returns The debounced error message
 */
declare function useDebouncedValidation<T>(value: T, validateFn: (val: T) => string | null, delay?: number): string | null;

declare function useFormDraft<T extends Record<string, any>>(key: string, initialValues: T): {
    formData: T;
    setFormData: React.Dispatch<React.SetStateAction<T>>;
    hasDraft: boolean;
    saveDraft: () => Promise<void>;
    restoreDraft: () => Promise<void>;
    clearDraft: () => Promise<void>;
};

declare function useIsMobile(): boolean;

export { useDebouncedValidation, useFormDraft, useIsMobile };
