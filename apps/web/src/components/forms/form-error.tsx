import React from "react";

interface FormErrorProps {
  errors?: string[] | string | undefined | null;
}

export function FormError({ errors }: FormErrorProps) {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) return null;
  
  const message = Array.isArray(errors) ? errors[0] : errors;
  
  return (
    <p className="text-red-500 text-[10px] mt-1 animate-in fade-in slide-in-from-top-1">
      {message}
    </p>
  );
}
